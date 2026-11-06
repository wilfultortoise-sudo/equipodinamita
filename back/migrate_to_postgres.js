import 'dotenv/config';
import { db } from './db.js';
import { pgPool } from './postgres.js';

async function migrateData() {
  console.log('===========================================================');
  console.log('  MIGRACIÓN DE DATOS RELACIONALES: SQLite -> PostgreSQL');
  console.log('===========================================================');

  if (!process.env.DATABASE_URL) {
    console.error('[Error] DATABASE_URL no está definida en back/.env.');
    console.log('Por favor define DATABASE_URL con tu cadena de conexión PostgreSQL (Supabase/Neon/Local).');
    console.log('Ejemplo: DATABASE_URL=postgresql://postgres:password@localhost:5432/bibliotech');
    process.exit(1);
  }

  const client = await pgPool.connect();

  try {
    console.log('[1/5] Migrando Categorías...');
    const categorias = db.prepare('SELECT * FROM categorias').all();
    for (const c of categorias) {
      await client.query(`
        INSERT INTO categorias (id, nombre, descripcion, icono, slug)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          descripcion = EXCLUDED.descripcion,
          icono = EXCLUDED.icono,
          slug = EXCLUDED.slug;
      `, [c.id, c.nombre, c.descripcion, c.icono, c.slug]);
    }
    await client.query(`SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));`);
    console.log(`  ✓ ${categorias.length} categorías sincronizadas.`);

    console.log('[2/5] Migrando Libros y Productos...');
    const productos = db.prepare('SELECT * FROM productos').all();
    for (const p of productos) {
      await client.query(`
        INSERT INTO productos (id, titulo, autor, isbn, editorial, precio, precioAnterior, imagen, categoriaId, stock, descripcion, paginas, rating, resenasCount, destacado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          titulo = EXCLUDED.titulo,
          autor = EXCLUDED.autor,
          precio = EXCLUDED.precio,
          stock = EXCLUDED.stock;
      `, [p.id, p.titulo, p.autor, p.isbn, p.editorial, p.precio, p.precioAnterior, p.imagen, p.categoriaId, p.stock, p.descripcion, p.paginas, p.rating, p.resenasCount, Boolean(p.destacado)]);
    }
    await client.query(`SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));`);
    console.log(`  ✓ ${productos.length} productos sincronizados.`);

    console.log('[3/5] Migrando Usuarios...');
    const usuarios = db.prepare('SELECT * FROM usuarios').all();
    for (const u of usuarios) {
      await client.query(`
        INSERT INTO usuarios (id, nombre, email, password, rol, telefono, direccion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          password = EXCLUDED.password;
      `, [u.id, u.nombre, u.email, u.password, u.rol, u.telefono, u.direccion]);
    }
    await client.query(`SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));`);
    console.log(`  ✓ ${usuarios.length} usuarios sincronizados.`);

    console.log('[4/5] Migrando Pedidos...');
    const pedidos = db.prepare('SELECT * FROM pedidos').all();
    for (const ped of pedidos) {
      await client.query(`
        INSERT INTO pedidos (id, folio, fecha, subtotal, envio, total, status, metodoPago, direccionEnvio, nombreCliente, emailCliente, usuarioId, detallesPago, referenciaPago)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          total = EXCLUDED.total;
      `, [ped.id, ped.folio, ped.fecha, ped.subtotal, ped.envio, ped.total, ped.status, ped.metodoPago, ped.direccionEnvio, ped.nombreCliente, ped.emailCliente, ped.usuarioId, ped.detallesPago, ped.referenciaPago]);
    }
    if (pedidos.length > 0) {
      await client.query(`SELECT setval('pedidos_id_seq', (SELECT MAX(id) FROM pedidos));`);
    }
    console.log(`  ✓ ${pedidos.length} pedidos sincronizados.`);

    console.log('[5/5] Migrando Detalles de Pedido...');
    const detalles = db.prepare('SELECT * FROM detalles_pedido').all();
    for (const d of detalles) {
      await client.query(`
        INSERT INTO detalles_pedido (id, pedidoId, productoId, cantidad, precioUnitario, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING;
      `, [d.id, d.pedidoId, d.productoId, d.cantidad, d.precioUnitario, d.subtotal]);
    }
    if (detalles.length > 0) {
      await client.query(`SELECT setval('detalles_pedido_id_seq', (SELECT MAX(id) FROM detalles_pedido));`);
    }
    console.log(`  ✓ ${detalles.length} detalles de pedidos sincronizados.`);

    console.log('===========================================================');
    console.log('  ¡MIGRACIÓN COMPLETA! PostgreSQL está 100% sincronizado.');
    console.log('===========================================================');
  } catch (err) {
    console.error('[Error durante la migración]', err);
  } finally {
    client.release();
    await pgPool.end();
  }
}

migrateData();
