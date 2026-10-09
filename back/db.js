import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'ecommerce.db');
const sqlInitPath = path.join(__dirname, 'db.sql');

export const db = new DatabaseSync(dbPath);

const JWT_SECRET = process.env.JWT_SECRET || 'bibliotech_secret_key_ceti_2026_integrador';

export function generateToken(usuario) {
  const payload = {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 dias
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const parts = cleanToken.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');
  if (signature !== expectedSignature) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyPassword(inputPassword, storedPassword) {
  if (!inputPassword || !storedPassword) return false;
  const hashedInput = crypto.createHash('sha256').update(inputPassword).digest('hex');
  return storedPassword === hashedInput || 
         storedPassword === inputPassword || 
         storedPassword === `hash_pass_${inputPassword}` ||
         (storedPassword.startsWith('hash_pass_') && inputPassword === storedPassword.replace('hash_pass_', ''));
}

// Inicializar esquema si no existen tablas
export function initDB() {
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='productos'").all();
  if (tableCheck.length === 0) {
    console.log('[DB] Inicializando base de datos desde db.sql...');
    if (fs.existsSync(sqlInitPath)) {
      const sqlContent = fs.readFileSync(sqlInitPath, 'utf8');
      db.exec(sqlContent);
      console.log('[DB] Base de datos SQLite creada y poblada exitosamente.');
    } else {
      console.error('[DB] No se encontro db.sql para inicializar la base de datos.');
    }
  } else {
    console.log('[DB] Base de datos SQLite conectada correctamente (' + dbPath + ').');
  }

  // Migracion automatica para soporte de pasarela multimetodo
  try {
    const cols = db.prepare("PRAGMA table_info(pedidos)").all().map(c => c.name);
    if (!cols.includes('detallesPago')) {
      db.exec("ALTER TABLE pedidos ADD COLUMN detallesPago TEXT;");
      console.log('[DB] Columna detallesPago añadida a tabla pedidos.');
    }
    if (!cols.includes('referenciaPago')) {
      db.exec("ALTER TABLE pedidos ADD COLUMN referenciaPago TEXT;");
      console.log('[DB] Columna referenciaPago añadida a tabla pedidos.');
    }
  } catch (err) {
    console.warn('[DB] Verificacion de columnas en pedidos:', err.message);
  }
}

// Repositorios de datos
export const dbRepo = {
  // Categorias
  getCategorias: () => {
    return db.prepare('SELECT * FROM categorias ORDER BY id ASC').all();
  },
  getCategoriaById: (id) => {
    return db.prepare('SELECT * FROM categorias WHERE id = ?').get(id) || null;
  },
  
  // Productos
  getProductos: ({ categoriaId, busqueda, limite, desde } = {}) => {
    let query = 'SELECT * FROM productos WHERE 1=1';
    const params = [];

    if (categoriaId) {
      query += ' AND categoriaId = ?';
      params.push(categoriaId);
    }

    if (busqueda && busqueda.trim() !== '') {
      query += ' AND (titulo LIKE ? OR autor LIKE ? OR descripcion LIKE ?)';
      const term = `%${busqueda.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY destacado DESC, id ASC';

    if (limite) {
      query += ' LIMIT ?';
      params.push(limite);
      if (desde) {
        query += ' OFFSET ?';
        params.push(desde);
      }
    }

    return db.prepare(query).all(...params);
  },
  getProductoById: (id) => {
    return db.prepare('SELECT * FROM productos WHERE id = ?').get(id) || null;
  },
  getProductosByCategoriaId: (categoriaId) => {
    return db.prepare('SELECT * FROM productos WHERE categoriaId = ? ORDER BY id ASC').all(categoriaId);
  },

  // Usuarios
  getUsuarios: () => {
    return db.prepare('SELECT id, nombre, email, rol, telefono, direccion FROM usuarios ORDER BY id ASC').all();
  },
  getUsuarioById: (id) => {
    return db.prepare('SELECT id, nombre, email, rol, telefono, direccion FROM usuarios WHERE id = ?').get(id) || null;
  },
  getUsuarioByEmail: (email) => {
    return db.prepare('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)').get(email?.trim()) || null;
  },
  crearUsuario: ({ nombre, email, password, telefono, direccion, rol = 'CLIENTE' }) => {
    const existing = dbRepo.getUsuarioByEmail(email);
    if (existing) {
      throw new Error(`El correo "${email}" ya se encuentra registrado.`);
    }
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const stmt = db.prepare(`
      INSERT INTO usuarios (nombre, email, password, rol, telefono, direccion)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(nombre.trim(), email.toLowerCase().trim(), hashedPassword, rol, telefono || null, direccion || null);
    return dbRepo.getUsuarioById(info.lastInsertRowid);
  },
  loginUsuario: (email, password) => {
    if (!email || !password) {
      throw new Error('Debe proporcionar correo y contraseña.');
    }
    const user = dbRepo.getUsuarioByEmail(email);
    if (!user) {
      throw new Error('Credenciales incorrectas: no existe un usuario con este correo.');
    }
    if (!verifyPassword(password, user.password)) {
      throw new Error('Credenciales incorrectas: la contraseña ingresada no es válida.');
    }
    const token = generateToken(user);
    const safeUser = dbRepo.getUsuarioById(user.id);
    return {
      token,
      usuario: safeUser
    };
  },
  registroUsuario: ({ nombre, email, password, telefono, direccion }) => {
    if (!nombre || !email || !password) {
      throw new Error('Nombre, correo y contraseña son campos obligatorios.');
    }
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }
    const telefonoLimpio = telefono == null ? '' : String(telefono).trim();
    if (telefonoLimpio && !/^\d{10}$/.test(telefonoLimpio)) {
      throw new Error('El teléfono debe contener exactamente 10 dígitos y solo números.');
    }
    const safeUser = dbRepo.crearUsuario({ nombre, email, password, telefono, direccion });
    const token = generateToken(safeUser);
    return {
      token,
      usuario: safeUser
    };
  },

  // Pedidos
  getPedidos: () => {
    return db.prepare('SELECT * FROM pedidos ORDER BY id DESC').all();
  },
  getPedidoById: (id) => {
    return db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id) || null;
  },
  getPedidosByUsuarioId: (usuarioId) => {
    return db.prepare('SELECT * FROM pedidos WHERE usuarioId = ? ORDER BY id DESC').all(usuarioId);
  },
  getDetallesByPedidoId: (pedidoId) => {
    return db.prepare('SELECT * FROM detalles_pedido WHERE pedidoId = ?').all(pedidoId);
  },

  // ==========================================================
  // KPIs DEL PANEL ADMINISTRATIVO
  // ==========================================================

  getAdminKPIs: () => {

    const ventas = db.prepare(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM pedidos
      WHERE status != 'CANCELADO'
    `).get();

    const pedidos = db.prepare(`
      SELECT COUNT(*) AS total
      FROM pedidos
    `).get();

    const clientes = db.prepare(`
      SELECT COUNT(*) AS total
      FROM usuarios
      WHERE rol = 'CLIENTE'
    `).get();

    const productos = db.prepare(`
      SELECT COUNT(*) AS total
      FROM productos
    `).get();

    const pendientes = db.prepare(`
      SELECT COUNT(*) AS total
      FROM pedidos
      WHERE status = 'PENDIENTE'
    `).get();

    const preparando = db.prepare(`
      SELECT COUNT(*) AS total
      FROM pedidos
      WHERE status = 'PREPARANDO'
    `).get();

    const enviados = db.prepare(`
      SELECT COUNT(*) AS total
      FROM pedidos
      WHERE status = 'ENVIADO'
    `).get();

    const entregados = db.prepare(`
      SELECT COUNT(*) AS total
      FROM pedidos
      WHERE status = 'ENTREGADO'
    `).get();

    return {
      ventasTotales: Number(ventas.total || 0),
      totalPedidos: Number(pedidos.total || 0),
      totalClientes: Number(clientes.total || 0),
      totalProductos: Number(productos.total || 0),
      pedidosPendientes: Number(pendientes.total || 0),
      pedidosPreparando: Number(preparando.total || 0),
      pedidosEnviados: Number(enviados.total || 0),
      pedidosEntregados: Number(entregados.total || 0)
    };
  },

  // Mutaciones CRUD Productos
  crearProducto: (datos) => {
    const { titulo, autor, isbn, editorial, precio, precioAnterior, imagen, categoriaId, stock, descripcion, paginas, rating, resenasCount, destacado } = datos;
    const stmt = db.prepare(`
      INSERT INTO productos (titulo, autor, isbn, editorial, precio, precioAnterior, imagen, categoriaId, stock, descripcion, paginas, rating, resenasCount, destacado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      titulo,
      autor,
      isbn || null,
      editorial || null,
      precio,
      precioAnterior || null,
      imagen || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
      categoriaId,
      stock,
      descripcion || '',
      paginas || 300,
      rating || 4.8,
      resenasCount || 0,
      destacado ? 1 : 0
    );
    return dbRepo.getProductoById(info.lastInsertRowid);
  },

  actualizarProducto: (id, datos) => {
    const current = dbRepo.getProductoById(id);
    if (!current) throw new Error(`Producto con ID ${id} no encontrado.`);

    const updated = { ...current, ...datos };
    const stmt = db.prepare(`
      UPDATE productos 
      SET titulo = ?, autor = ?, isbn = ?, editorial = ?, precio = ?, precioAnterior = ?, imagen = ?, categoriaId = ?, stock = ?, descripcion = ?, paginas = ?, rating = ?, resenasCount = ?, destacado = ?
      WHERE id = ?
    `);
    stmt.run(
      updated.titulo,
      updated.autor,
      updated.isbn,
      updated.editorial,
      updated.precio,
      updated.precioAnterior,
      updated.imagen,
      updated.categoriaId,
      updated.stock,
      updated.descripcion,
      updated.paginas,
      updated.rating,
      updated.resenasCount,
      updated.destacado ? 1 : 0,
      id
    );
    return dbRepo.getProductoById(id);
  },

  eliminarProducto: (id) => {
    const current = dbRepo.getProductoById(id);
    if (!current) return false;
    const stmt = db.prepare('DELETE FROM productos WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },

  // Mutacion de Negocio: Crear Pedido con transaccion e inventario
  crearPedido: (datos) => {
    const {
      items,
      metodoPago,
      direccionEnvio,
      nombreCliente,
      emailCliente,
      usuarioId,
      detallesPago,
      referenciaPago
    } = datos;

    if (!items || items.length === 0) {
      throw new Error('El pedido debe incluir al menos un producto.');
    }

    // 1. Validar productos y existencias
    let subtotal = 0;
    const productosValidados = [];

    for (const item of items) {
      const cantidad = Number(item.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error(`Cantidad inválida para el producto con ID ${item.productoId}. Debe ser un número entero positivo.`);
      }

      const prod = dbRepo.getProductoById(item.productoId);
      if (!prod) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado en el catalogo.`);
      }
      if (prod.stock < cantidad) {
        throw new Error(`Stock insuficiente para "${prod.titulo}". Solicitado: ${cantidad}, Disponible: ${prod.stock}`);
      }

      const itemSubtotal = prod.precio * cantidad;
      subtotal += itemSubtotal;
      productosValidados.push({
        producto: prod,
        cantidad: cantidad,
        precioUnitario: prod.precio,
        subtotal: itemSubtotal
      });
    }

    const envio = subtotal > 999 ? 0.0 : 99.0;
    const total = subtotal + envio;
    const fecha = new Date().toISOString();
    const folio = `FOL-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const statusInicial = (metodoPago === 'OXXO_EFECTIVO' || metodoPago === 'TRANSFERENCIA_SPEI') ? 'PENDIENTE' : 'PAGADO';
    const refFinal = referenciaPago || (metodoPago === 'OXXO_EFECTIVO' ? `OXXO-${Math.floor(10000000000000 + Math.random() * 90000000000000)}` : null);

    // 2. Resolver usuarioId válido para prevenir error de FOREIGN KEY constraint
    let validUsuarioId = null;
    if (usuarioId !== undefined && usuarioId !== null && usuarioId !== '') {
      const parsedId = Number(usuarioId);
      if (!Number.isNaN(parsedId)) {
        const u = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(parsedId);
        if (u) validUsuarioId = u.id;
      }
    }

    // Si no se encontró por ID pero tenemos emailCliente, asociar si el usuario existe
    if (!validUsuarioId && emailCliente) {
      const u = db.prepare('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)').get(emailCliente.trim());
      if (u) validUsuarioId = u.id;
    }

    // 3. Ejecutar insercion y actualizacion de stock
    db.exec('BEGIN TRANSACTION;');
    try {
      // Insertar pedido
      const stmtPedido = db.prepare(`
        INSERT INTO pedidos (folio, fecha, subtotal, envio, total, status, metodoPago, direccionEnvio, nombreCliente, emailCliente, usuarioId, detallesPago, referenciaPago)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const pedidoInfo = stmtPedido.run(
        folio,
        fecha,
        subtotal,
        envio,
        total,
        statusInicial,
        metodoPago || 'TARJETA_CREDITO',
        direccionEnvio,
        nombreCliente,
        emailCliente,
        validUsuarioId,
        detallesPago || null,
        refFinal
      );
      const pedidoId = pedidoInfo.lastInsertRowid;

      // Insertar detalles y descontar stock
      const stmtDetalle = db.prepare(`
        INSERT INTO detalles_pedido (pedidoId, productoId, cantidad, precioUnitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);
      const stmtStock = db.prepare(`
        UPDATE productos SET stock = stock - ? WHERE id = ?
      `);

      for (const p of productosValidados) {
        stmtDetalle.run(pedidoId, p.producto.id, p.cantidad, p.precioUnitario, p.subtotal);
        stmtStock.run(p.cantidad, p.producto.id);
      }

      db.exec('COMMIT;');
      return dbRepo.getPedidoById(pedidoId);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw new Error(`Error al procesar el pedido: ${err.message}`);
    }
  },

  actualizarEstadoPedido: (id, status) => {
    const stmt = db.prepare('UPDATE pedidos SET status = ? WHERE id = ?');
    stmt.run(status, id);
    return dbRepo.getPedidoById(id);
  }
};
