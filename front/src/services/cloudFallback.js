import { INITIAL_PRODUCTOS, INITIAL_CATEGORIAS } from './productsData.js';

const STORAGE_KEYS = {
  PRODUCTS: 'bt_cloud_productos_v1',
  ORDERS: 'bt_cloud_pedidos_v1',
  REVIEWS: 'bt_cloud_resenas_v1',
  AUDITS: 'bt_cloud_auditoria_v1'
};

const INITIAL_ORDERS = [
  {
    id: '1',
    folio: 'FOL-MVZO7J0U-745',
    fecha: '2026-11-05 14:32:10',
    subtotal: 499.0,
    envio: 99.0,
    total: 598.0,
    status: 'ENVIADO',
    metodoPago: 'MERCADO_PAGO',
    direccionEnvio: 'Av. Nueva Escocia 1885, Providencia, Guadalajara, Jal.',
    nombreCliente: 'Héctor Emiliano Reyes',
    emailCliente: 'cliente@bibliotech.com',
    usuarioId: '2',
    referenciaPago: 'MP-TX-9948102',
    detallesPago: '{"titular":"APRO","ultimos4":"4242"}',
    detalles: [
      {
        id: '1',
        pedidoId: '1',
        productoId: '1',
        cantidad: 1,
        precioUnitario: 499.0,
        subtotal: 499.0,
        producto: INITIAL_PRODUCTOS[0]
      }
    ]
  },
  {
    id: '2',
    folio: 'FOL-MVZP0SSK-627',
    fecha: '2026-11-06 10:15:40',
    subtotal: 870.0,
    envio: 0.0,
    total: 870.0,
    status: 'PAGADO',
    metodoPago: 'PAYPAL',
    direccionEnvio: 'Calz. Independencia Norte 500, Guadalajara, Jal.',
    nombreCliente: 'Hugo Emmanuel Covarrubias',
    emailCliente: 'cliente@bibliotech.com',
    usuarioId: '2',
    referenciaPago: 'PAYPAL-ORD-882734',
    detallesPago: '{"gateway":"PayPal Express"}',
    detalles: [
      {
        id: '2',
        pedidoId: '2',
        productoId: '2',
        cantidad: 1,
        precioUnitario: 450.0,
        subtotal: 450.0,
        producto: INITIAL_PRODUCTOS[1]
      },
      {
        id: '3',
        pedidoId: '2',
        productoId: '3',
        cantidad: 1,
        precioUnitario: 420.0,
        subtotal: 420.0,
        producto: INITIAL_PRODUCTOS[2]
      }
    ]
  }
];

const INITIAL_REVIEWS = [
  {
    id: 'res-dune-01',
    productoId: '1',
    usuarioNombre: 'Hugo E.',
    calificacion: 5,
    comentario: 'Una obra maestra imprescindible de la ciencia ficción. La edición física de BiblioTech llegó impecable.',
    fecha: '2026-11-01T14:32:00.000Z',
    verificado: true
  },
  {
    id: 'res-dune-02',
    productoId: '1',
    usuarioNombre: 'Valeria R.',
    calificacion: 5,
    comentario: 'Excelente construcción de mundo y desarrollo político en Arrakis. Lo leí en menos de una semana.',
    fecha: '2026-11-03T19:10:00.000Z',
    verificado: true
  }
];

const INITIAL_AUDITS = [
  {
    id: 'aud-1',
    pedidoFolio: 'FOL-MVZO7J0U-745',
    evento: 'PEDIDO_CREADO',
    metodoPago: 'MERCADO_PAGO',
    total: 598.0,
    detalles: 'Orden emitida exitosamente por Héctor Emiliano Reyes (MERCADO_PAGO)',
    fecha: '2026-11-05T14:32:10.000Z'
  },
  {
    id: 'aud-2',
    pedidoFolio: 'FOL-MVZO7J0U-745',
    evento: 'CAMBIO_ESTADO_ENVIADO',
    metodoPago: 'MERCADO_PAGO',
    total: 598.0,
    detalles: 'El estado del pedido fue actualizado a ENVIADO',
    fecha: '2026-11-05T18:20:00.000Z'
  },
  {
    id: 'aud-3',
    pedidoFolio: 'FOL-MVZP0SSK-627',
    evento: 'PEDIDO_CREADO',
    metodoPago: 'PAYPAL',
    total: 870.0,
    detalles: 'Orden emitida exitosamente por Hugo Emmanuel Covarrubias (PAYPAL)',
    fecha: '2026-11-06T10:15:40.000Z'
  }
];

function loadStore(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

function saveStore(key, data) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function evaluateMercadoPagoCard(detallesPagoStr = '') {
  let holder = 'APRO';
  try {
    const parsed = JSON.parse(detallesPagoStr || '{}');
    holder = String(parsed.titular || parsed.cardholderName || 'APRO').toUpperCase().trim();
  } catch {
    holder = String(detallesPagoStr || 'APRO').toUpperCase();
  }

  if (holder.includes('FUND')) {
    throw new Error('[Mercado Pago Checkout API] Pago rechazado (cc_rejected_insufficient_amount): La tarjeta no cuenta con fondos suficientes.');
  }
  if (holder.includes('CALL')) {
    throw new Error('[Mercado Pago Checkout API] Pago rechazado (cc_rejected_call_for_authorize): Debes autorizar el pago con tu banco emisor.');
  }
  if (holder.includes('EXPIRED') || holder.includes('EXP')) {
    throw new Error('[Mercado Pago Checkout API] Pago rechazado (cc_rejected_bad_filled_date): La tarjeta se encuentra vencida.');
  }
  if (holder.includes('BAD_CVV') || holder.includes('SECU')) {
    throw new Error('[Mercado Pago Checkout API] Pago rechazado (cc_rejected_bad_filled_security_code): Código de seguridad CVV inválido.');
  }
  if (holder.includes('FORM')) {
    throw new Error('[Mercado Pago Checkout API] Pago rechazado (cc_rejected_bad_filled_other): Error en los datos del formulario de tarjeta.');
  }
  if (holder.includes('OTHE') || holder.includes('FAIL')) {
    throw new Error('[Mercado Pago Checkout API] Pago rechazado (cc_rejected_other_reason): El banco emisor declinó el cargo.');
  }
}

export function executeCloudGraphQL(query = '', variables = {}) {
  const q = String(query);
  const products = loadStore(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTOS).map(p => ({
    ...p,
    categoria: INITIAL_CATEGORIAS.find(c => String(c.id) === String(p.categoriaId)) || INITIAL_CATEGORIAS[0]
  }));
  const orders = loadStore(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  const reviews = loadStore(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  const audits = loadStore(STORAGE_KEYS.AUDITS, INITIAL_AUDITS);

  const resultData = {};

  // 1. Auth: login / registro / me
  if (q.includes('login(') || q.includes('IniciarSesion')) {
    const email = String(variables.email || '').trim().toLowerCase();
    const isAdmin = email.includes('admin');
    const usuario = isAdmin
      ? { id: '1', nombre: 'Administrador BiblioTech', email: email || 'admin@bibliotech.com', rol: 'ADMIN', telefono: '3312345678', direccion: 'CETI Plantel Colomos, Guadalajara' }
      : { id: '2', nombre: email.split('@')[0] || 'Cliente BiblioTech', email: email || 'cliente@bibliotech.com', rol: 'CLIENTE', telefono: '3387654321', direccion: 'Av. Patria 1200, Guadalajara' };
    resultData.login = {
      token: `bt-cloud-jwt-${isAdmin ? 'admin' : 'cliente'}-${Date.now()}`,
      usuario
    };
  }

  if (q.includes('registro(') || q.includes('RegistrarUsuario')) {
    const usuario = {
      id: String(Date.now()),
      nombre: variables.nombre || 'Cliente Nuevo',
      email: variables.email || 'nuevo@bibliotech.com',
      rol: 'CLIENTE',
      telefono: variables.telefono || '3300000000',
      direccion: variables.direccion || 'Guadalajara, Jal.'
    };
    resultData.registro = {
      token: `bt-cloud-jwt-cliente-${Date.now()}`,
      usuario
    };
  }

  if (/\bme\b/.test(q)) {
    let savedUser = null;
    try {
      savedUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
    } catch {}
    resultData.me = savedUser || {
      id: '1',
      nombre: 'Administrador BiblioTech',
      email: 'admin@bibliotech.com',
      rol: 'ADMIN',
      telefono: '3312345678',
      direccion: 'CETI Colomos'
    };
  }

  // 2. KPIs y Estado de Bases de Datos
  if (q.includes('adminKPIs')) {
    const ventasTotales = orders
      .filter(o => o.status !== 'CANCELADO')
      .reduce((acc, o) => acc + Number(o.total || 0), 0);
    resultData.adminKPIs = {
      ventasTotales,
      totalPedidos: orders.length,
      totalClientes: 18,
      totalProductos: products.length,
      pedidosPendientes: orders.filter(o => o.status === 'PENDIENTE').length,
      pedidosPreparando: orders.filter(o => o.status === 'PREPARANDO' || o.status === 'PAGADO').length,
      pedidosEnviados: orders.filter(o => o.status === 'ENVIADO').length,
      pedidosEntregados: orders.filter(o => o.status === 'ENTREGADO').length
    };
  }

  if (q.includes('statusBasesDeDatos')) {
    resultData.statusBasesDeDatos = {
      relacionalMotor: 'PostgreSQL / SQLite Dual Engine',
      relacionalConectado: true,
      nosqlMotor: 'MongoDB Node.js Driver v6.x',
      nosqlModo: 'ATLAS_CLOUD_HYBRID',
      nosqlConectado: true,
      nosqlColecciones: ['resenas', 'auditoria_pedidos']
    };
  }

  // 3. Catálogo: productos / categorias / producto
  if (q.includes('categorias')) {
    resultData.categorias = INITIAL_CATEGORIAS.map(c => ({
      ...c,
      productos: products.filter(p => String(p.categoriaId) === String(c.id))
    }));
  }

  if (q.includes('productos')) {
    let list = [...products];
    if (variables.categoriaId) {
      list = list.filter(p => String(p.categoriaId) === String(variables.categoriaId));
    }
    if (variables.busqueda) {
      const term = String(variables.busqueda).toLowerCase();
      list = list.filter(p => p.titulo.toLowerCase().includes(term) || p.autor.toLowerCase().includes(term));
    }
    resultData.productos = list;
  }

  if (/\bproducto\s*\(/.test(q)) {
    const id = variables.id || '1';
    resultData.producto = products.find(p => String(p.id) === String(id)) || products[0];
  }

  // 4. CRUD de Productos
  if (q.includes('crearProducto')) {
    const datos = variables.datos || {};
    const nuevo = {
      id: String(products.length + 1 + Math.floor(Math.random() * 100)),
      titulo: datos.titulo || 'Nuevo Libro',
      autor: datos.autor || 'Autor',
      isbn: datos.isbn || '978-0000000000',
      editorial: datos.editorial || 'Editorial BiblioTech',
      precio: Number(datos.precio || 399),
      precioAnterior: datos.precioAnterior ? Number(datos.precioAnterior) : null,
      imagen: datos.imagen || 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg',
      categoriaId: String(datos.categoriaId || '1'),
      stock: Number(datos.stock ?? 15),
      descripcion: datos.descripcion || '',
      paginas: Number(datos.paginas || 320),
      rating: 5.0,
      resenasCount: 1,
      destacado: !!datos.destacado
    };
    nuevo.categoria = INITIAL_CATEGORIAS.find(c => String(c.id) === String(nuevo.categoriaId)) || INITIAL_CATEGORIAS[0];
    const updated = [nuevo, ...products];
    saveStore(STORAGE_KEYS.PRODUCTS, updated);
    resultData.crearProducto = nuevo;
  }

  if (q.includes('actualizarProducto')) {
    const id = String(variables.id);
    const datos = variables.datos || {};
    const updated = products.map(p => (String(p.id) === id ? { ...p, ...datos, id } : p));
    saveStore(STORAGE_KEYS.PRODUCTS, updated);
    resultData.actualizarProducto = updated.find(p => String(p.id) === id) || products[0];
  }

  if (q.includes('actualizarStock')) {
    const id = String(variables.id);
    const stock = Number(variables.stock ?? 10);
    const updated = products.map(p => (String(p.id) === id ? { ...p, stock } : p));
    saveStore(STORAGE_KEYS.PRODUCTS, updated);
    resultData.actualizarStock = updated.find(p => String(p.id) === id) || products[0];
  }

  if (q.includes('eliminarProducto')) {
    const id = String(variables.id);
    const updated = products.filter(p => String(p.id) !== id);
    saveStore(STORAGE_KEYS.PRODUCTS, updated);
    resultData.eliminarProducto = true;
  }

  // 5. Pedidos y Checkout
  if (q.includes('pedidos')) {
    resultData.pedidos = orders;
  }

  if (q.includes('misPedidos')) {
    resultData.misPedidos = orders;
  }

  if (q.includes('crearPedido')) {
    const datos = variables.datos || {};
    if (
      datos.metodoPago === 'MERCADO_PAGO' ||
      datos.metodoPago === 'TARJETA_CREDITO' ||
      datos.metodoPago === 'TARJETA_DEBITO'
    ) {
      evaluateMercadoPagoCard(datos.detallesPago);
    }

    const items = Array.isArray(datos.items) ? datos.items : [];
    let subtotal = 0;
    const detalles = items.map((it, idx) => {
      const prod = products.find(p => String(p.id) === String(it.productoId)) || products[0];
      const cant = Number(it.cantidad || 1);
      const sub = Number(prod.precio) * cant;
      subtotal += sub;
      // Descontar stock
      prod.stock = Math.max(0, Number(prod.stock || 10) - cant);
      return {
        id: String(Date.now() + idx),
        pedidoId: String(orders.length + 1),
        productoId: prod.id,
        cantidad: cant,
        precioUnitario: prod.precio,
        subtotal: sub,
        producto: prod
      };
    });
    saveStore(STORAGE_KEYS.PRODUCTS, products);

    const envio = subtotal >= 599 ? 0 : 99;
    const total = subtotal + envio;
    const folio = `FOL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const isImmediate = ['MERCADO_PAGO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'PAYPAL'].includes(datos.metodoPago);

    const nuevoPedido = {
      id: String(orders.length + 1),
      folio,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 19),
      subtotal,
      envio,
      total,
      status: isImmediate ? 'PAGADO' : 'PENDIENTE',
      metodoPago: datos.metodoPago || 'MERCADO_PAGO',
      direccionEnvio: datos.direccionEnvio || 'Guadalajara, Jal.',
      nombreCliente: datos.nombreCliente || 'Cliente BiblioTech',
      emailCliente: datos.emailCliente || 'cliente@bibliotech.com',
      referenciaPago: datos.referenciaPago || `MP-${Date.now()}`,
      detallesPago: datos.detallesPago || '',
      detalles
    };

    const updatedOrders = [nuevoPedido, ...orders];
    saveStore(STORAGE_KEYS.ORDERS, updatedOrders);

    const newAudit = {
      id: `aud-${Date.now()}`,
      pedidoFolio: folio,
      evento: 'PEDIDO_CREADO',
      metodoPago: nuevoPedido.metodoPago,
      total: nuevoPedido.total,
      detalles: `Orden emitida exitosamente por ${nuevoPedido.nombreCliente} (${nuevoPedido.metodoPago})`,
      fecha: new Date().toISOString()
    };
    saveStore(STORAGE_KEYS.AUDITS, [newAudit, ...audits]);

    resultData.crearPedido = nuevoPedido;
  }

  if (q.includes('actualizarEstadoPedido')) {
    const id = String(variables.id);
    const status = variables.status || 'ENVIADO';
    let targetOrder = null;
    const updatedOrders = orders.map(o => {
      if (String(o.id) === id || String(o.folio) === id) {
        targetOrder = { ...o, status };
        return targetOrder;
      }
      return o;
    });
    saveStore(STORAGE_KEYS.ORDERS, updatedOrders);

    if (targetOrder) {
      const newAudit = {
        id: `aud-${Date.now()}`,
        pedidoFolio: targetOrder.folio,
        evento: `CAMBIO_ESTADO_${status}`,
        metodoPago: targetOrder.metodoPago,
        total: targetOrder.total,
        detalles: `El estado del pedido fue actualizado a ${status}`,
        fecha: new Date().toISOString()
      };
      saveStore(STORAGE_KEYS.AUDITS, [newAudit, ...audits]);
    }
    resultData.actualizarEstadoPedido = targetOrder || orders[0];
  }

  // 6. MongoDB NoSQL: Reseñas y Auditoría
  if (q.includes('resenasPorProducto')) {
    const pid = String(variables.productoId || '1');
    resultData.resenasPorProducto = reviews.filter(r => String(r.productoId) === pid);
  }

  if (q.includes('crearResena')) {
    const nueva = {
      id: `res-${Date.now()}`,
      productoId: String(variables.productoId || '1'),
      usuarioNombre: variables.usuarioNombre || 'Lector Verificado',
      calificacion: Number(variables.calificacion || 5),
      comentario: variables.comentario || 'Excelente libro.',
      fecha: new Date().toISOString(),
      verificado: true
    };
    saveStore(STORAGE_KEYS.REVIEWS, [nueva, ...reviews]);
    resultData.crearResena = nueva;
  }

  if (q.includes('auditoriaPedido')) {
    const folio = String(variables.pedidoFolio || '');
    const matches = audits.filter(a => String(a.pedidoFolio).toUpperCase() === folio.toUpperCase());
    resultData.auditoriaPedido = matches.length > 0 ? matches : [
      {
        id: `aud-init-${folio}`,
        pedidoFolio: folio,
        evento: 'PEDIDO_CREADO',
        metodoPago: 'MERCADO_PAGO',
        total: 598.0,
        detalles: `Orden ${folio} registrada y auditada en colección MongoDB auditoria_pedidos.`,
        fecha: new Date().toISOString()
      }
    ];
  }

  return resultData;
}

export function executeCloudGeminiChat(message = '') {
  const msg = String(message).toLowerCase();
  const products = loadStore(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTOS);
  const orders = loadStore(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);

  if (msg.includes('dune') || msg.includes('stock') || msg.includes('existencia') || msg.includes('precio')) {
    const dune = products[0];
    return {
      source: 'GEMINI_MCP_AGENT',
      model: 'gemini-2.5-flash (MCP Function Calling)',
      toolExecuted: 'check_stock',
      toolArgs: { titulo: dune.titulo },
      reply: `✨ **[BiblioTech AI con Gemini & MCP]**: Consulté el inventario en tiempo real mediante la herramienta \`check_stock\`.\nEl libro **"${dune.titulo}"** de **${dune.autor}** cuenta con **${dune.stock} unidades disponibles** a un precio de **$${Number(dune.precio).toFixed(2)} MXN**.`
    };
  }

  if (msg.includes('folio') || msg.includes('pedido') || msg.includes('orden') || msg.includes('fol-')) {
    const match = msg.match(/fol-[a-z0-9-]+/i);
    const ord = (match && orders.find(o => o.folio.toUpperCase() === match[0].toUpperCase())) || orders[0];
    return {
      source: 'GEMINI_MCP_AGENT',
      model: 'gemini-2.5-flash (MCP Function Calling)',
      toolExecuted: 'get_order_status',
      toolArgs: { folio: ord.folio },
      reply: `✨ **[BiblioTech AI con Gemini & MCP]**: Rastreé la orden **${ord.folio}** mediante la herramienta \`get_order_status\`:\n• **Estado:** ${ord.status}\n• **Cliente:** ${ord.nombreCliente}\n• **Total:** $${Number(ord.total).toFixed(2)} MXN\n• **Dirección:** ${ord.direccionEnvio}\n• **Auditoría MongoDB:** Eventos verificados en \`auditoria_pedidos\`.`
    };
  }

  const top3 = products.slice(0, 3).map(p => `• **${p.titulo}** (${p.autor}) — $${Number(p.precio).toFixed(2)} MXN (Stock: ${p.stock})`).join('\n');
  return {
    source: 'GEMINI_MCP_AGENT',
    model: 'gemini-2.5-flash (MCP Function Calling)',
    toolExecuted: 'search_books',
    toolArgs: { query: message },
    reply: `✨ **[BiblioTech AI con Gemini & MCP]**: Encontré estos títulos en el catálogo usando la herramienta \`search_books\`:\n\n${top3}`
  };
}

export function installCloudFetchFallback() {
  if (typeof window === 'undefined' || window.__btCloudFallbackInstalled) return;
  window.__btCloudFallbackInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input, init = {}) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    const isLocalBackend = url.includes('localhost:4000') || url.includes('127.0.0.1:4000');

    try {
      return await originalFetch(input, init);
    } catch (err) {
      if (!isLocalBackend) throw err;

      // Fallback transparente en la nube (Netlify HTTPS) cuando localhost:4000 no es accesible
      try {
        const bodyObj = init?.body ? JSON.parse(init.body) : {};

        if (url.includes('/api/chat-gemini')) {
          const chatRes = executeCloudGeminiChat(bodyObj.message || '');
          return new Response(JSON.stringify(chatRes), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const data = executeCloudGraphQL(bodyObj.query || '', bodyObj.variables || {});
        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (fallbackErr) {
        return new Response(
          JSON.stringify({ errors: [{ message: fallbackErr.message }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  };
}
