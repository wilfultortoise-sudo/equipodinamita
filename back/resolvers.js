import { dbRepo } from './db.js';
import { pubsub, TOPICS } from './pubsub.js';
import { procesarPagoMercadoPago } from './mercadopago.js';
import { enviarCorreoConfirmacionPedido } from './mailer.js';
import { mongoReviews, mongoAudit, getMongoStatus } from './mongodb.js';
import { getPostgresStatus } from './postgres.js';

// ============================================================
// PROTECCIÓN DE ROL
// ============================================================

function requireAuth(context) {
  if (!context?.currentUser) {
    throw new Error('No autorizado: debe iniciar sesión.');
  }
  return context.currentUser;
}

function requireAdmin(context) {
  const user = requireAuth(context);
  if (user.rol !== 'ADMIN') {
    throw new Error('Acceso denegado: se requiere el rol ADMIN.');
  }
  return user;
}

function safePublish(topic, payload) {
  try {
    if (pubsub && typeof pubsub.publish === 'function') {
      pubsub.publish(topic, payload);
    }
  } catch (err) {
    console.warn(`[PubSub] Error al publicar en ${topic}:`, err.message);
  }
}

// ============================================================
// RESOLVERS
// ============================================================

export const resolvers = {
  // ==========================================================
  // QUERIES
  // ==========================================================
  Query: {
    productos: (_, { categoriaId, busqueda, limite, desde }) => {
      return dbRepo.getProductos({
        categoriaId,
        busqueda,
        limite,
        desde
      });
    },

    adminKPIs: () => {
      return dbRepo.getAdminKPIs();
    },

    producto: (_, { id }) => {
      return dbRepo.getProductoById(id);
    },

    categorias: () => {
      return dbRepo.getCategorias();
    },

    categoria: (_, { id }) => {
      return dbRepo.getCategoriaById(id);
    },

    usuarios: (_, __, context) => {
      requireAdmin(context);
      return dbRepo.getUsuarios();
    },

    usuario: (_, { id }, context) => {
      const user = requireAuth(context);
      if (user.rol !== 'ADMIN' && Number(user.id) !== Number(id)) {
        throw new Error(
          'Acceso denegado: no puedes consultar la información de otro usuario.'
        );
      }
      return dbRepo.getUsuarioById(id);
    },

    me: (_, __, context) => {
      return context?.currentUser || null;
    },

    pedidos: () => {
      return dbRepo.getPedidos();
    },

    misPedidos: (_, __, context) => {
      if (!context?.currentUser) {
        throw new Error('No autorizado: debe iniciar sesión para consultar sus órdenes.');
      }
      return dbRepo.getPedidosByUsuarioId(context.currentUser.id);
    },

    pedido: (_, { id }) => {
      return dbRepo.getPedidoById(id);
    },

    // ========================================================
    // QUERIES MONGODB NOSQL & POSTGRESQL (Paso 3)
    // ========================================================
    resenasPorProducto: async (_, { productoId }) => {
      return await mongoReviews.getByProduct(productoId);
    },

    auditoriaPedido: async (_, { pedidoFolio }) => {
      return await mongoAudit.getByFolio(pedidoFolio);
    },

    todasAuditorias: async (_, { limite }) => {
      return await mongoAudit.getAll(limite || 50);
    },

    statusBasesDeDatos: () => {
      const pg = getPostgresStatus();
      const mg = getMongoStatus();
      return {
        relacionalMotor: pg.engine,
        relacionalConectado: pg.isConnected,
        nosqlMotor: mg.driver,
        nosqlModo: mg.mode,
        nosqlConectado: mg.isConnected,
        nosqlColecciones: mg.collections
      };
    }
  },

  // ==========================================================
  // RELACIONES (Field Resolvers)
  // ==========================================================
  Categoria: {
    productos: (parent) => {
      return dbRepo.getProductosByCategoriaId(parent.id);
    }
  },

  Producto: {
    categoria: (parent) => {
      return dbRepo.getCategoriaById(parent.categoriaId);
    }
  },

  Usuario: {
    pedidos: (parent) => {
      return dbRepo.getPedidosByUsuarioId(parent.id);
    }
  },

  Pedido: {
    usuario: (parent) => {
      if (!parent.usuarioId) return null;
      return dbRepo.getUsuarioById(parent.usuarioId);
    },
    detalles: (parent) => {
      return dbRepo.getDetallesByPedidoId(parent.id);
    }
  },

  DetallePedido: {
    producto: (parent) => {
      return dbRepo.getProductoById(parent.productoId);
    }
  },

  // ==========================================================
  // MUTATIONS
  // ==========================================================
  Mutation: {
    login: (_, { email, password }) => {
      return dbRepo.loginUsuario(email, password);
    },

    registro: (_, { nombre, email, password, telefono, direccion }) => {
      return dbRepo.registroUsuario({ nombre, email, password, telefono, direccion });
    },

    crearProducto: (_, { datos }) => {
      const nuevoProducto = dbRepo.crearProducto(datos);
      safePublish(TOPICS.STOCK_ACTUALIZADO, { stockActualizado: nuevoProducto });
      return nuevoProducto;
    },

    actualizarProducto: (_, { id, datos }) => {
      const productoActualizado = dbRepo.actualizarProducto(id, datos);
      safePublish(TOPICS.STOCK_ACTUALIZADO, { stockActualizado: productoActualizado });
      return productoActualizado;
    },

    actualizarStock: (_, { id, stock }) => {
      const productoActualizado = dbRepo.actualizarStock(id, stock);
      safePublish(TOPICS.STOCK_ACTUALIZADO, { stockActualizado: productoActualizado });
      return productoActualizado;
    },

    eliminarProducto: (_, { id }, context) => {
      requireAdmin(context);
      return dbRepo.eliminarProducto(id);
    },

    crearPedido: async (_, { datos }, context) => {
      // Si hay usuario logueado en el contexto y no venia usuarioId, lo asignamos
      if (context?.currentUser) {
        datos.usuarioId = datos.usuarioId || context.currentUser.id;
        if (!datos.nombreCliente) datos.nombreCliente = context.currentUser.nombre;
        if (!datos.emailCliente) datos.emailCliente = context.currentUser.email;
      }

      // Validar pasarela Mercado Pago o pago con tarjeta bancaria
      if (
        datos.metodoPago === 'MERCADO_PAGO' ||
        datos.metodoPago === 'TARJETA_CREDITO' ||
        datos.metodoPago === 'TARJETA_DEBITO'
      ) {
        const resultadoMP = await procesarPagoMercadoPago({
          metodoPago: datos.metodoPago,
          detallesPago: datos.detallesPago,
          emailCliente: datos.emailCliente,
          nombreCliente: datos.nombreCliente
        });

        if (!resultadoMP.aprobado) {
          throw new Error(resultadoMP.mensaje);
        }

        if (resultadoMP.idTransaccion && !datos.referenciaPago) {
          datos.referenciaPago = resultadoMP.idTransaccion;
        }
      }

      const nuevoPedido = dbRepo.crearPedido(datos);

      // 1. Notificar inmediatamente la creación del pedido vía WebSocket
      safePublish(TOPICS.PEDIDO_CREADO, { pedidoCreado: nuevoPedido });

      // 2. Notificar actualización de stock de cada producto involucrado
      if (datos?.items && Array.isArray(datos.items)) {
        for (const item of datos.items) {
          const productoAfectado = dbRepo.getProductoById(item.productoId);
          if (productoAfectado) {
            safePublish(TOPICS.STOCK_ACTUALIZADO, { stockActualizado: productoAfectado });
          }
        }
      }

      // 3. Enviar correo transaccional de confirmación (API de Terceros 4)
      enviarCorreoConfirmacionPedido(nuevoPedido).catch(err => {
        console.warn('[Resolvers] Advertencia al despachar correo:', err.message);
      });

      // 4. Registrar auditoría del ciclo de vida en MongoDB NoSQL (Paso 3)
      mongoAudit.logEvent({
        pedidoFolio: nuevoPedido.folio,
        evento: 'PEDIDO_CREADO',
        metodoPago: nuevoPedido.metodoPago,
        total: nuevoPedido.total,
        detalles: `Orden emitida exitosamente por ${nuevoPedido.nombreCliente} (${nuevoPedido.metodoPago})`,
        metadata: {
          direccion: nuevoPedido.direccionEnvio,
          email: nuevoPedido.emailCliente,
          referencia: nuevoPedido.referenciaPago || null
        }
      }).catch(err => console.warn('[MongoDB Audit]', err.message));

      return nuevoPedido;
    },

    actualizarEstadoPedido: (_, { id, status }) => {
      const pedidoActualizado = dbRepo.actualizarEstadoPedido(id, status);
      safePublish(TOPICS.PEDIDO_ACTUALIZADO, { pedidoActualizado });

      // Registrar cambio de estado en MongoDB NoSQL (Paso 3)
      mongoAudit.logEvent({
        pedidoFolio: pedidoActualizado.folio,
        evento: `CAMBIO_ESTADO_${status}`,
        metodoPago: pedidoActualizado.metodoPago,
        total: pedidoActualizado.total,
        detalles: `El estado del pedido fue actualizado a ${status}`
      }).catch(err => console.warn('[MongoDB Audit]', err.message));

      return pedidoActualizado;
    },

    crearResena: async (_, { productoId, usuarioNombre, calificacion, comentario }) => {
      const resena = await mongoReviews.create({
        productoId,
        usuarioNombre,
        calificacion,
        comentario
      });

      // Recalcular promedio de rating y conteo de reseñas en la base relacional
      try {
        const todas = await mongoReviews.getByProduct(productoId);
        const count = todas.length;
        const avg = todas.reduce((acc, r) => acc + Number(r.calificacion), 0) / (count || 1);
        const rounded = Math.round(avg * 10) / 10;
        
        dbRepo.actualizarProducto(productoId, {
          rating: rounded,
          resenasCount: count
        });
      } catch (e) {
        console.warn('[Resolvers] Error al actualizar métricas del libro:', e.message);
      }

      return resena;
    }
  },

  Subscription: {
    pedidoCreado: {
      subscribe: () => pubsub.asyncIterator([TOPICS.PEDIDO_CREADO])
    },
    pedidoActualizado: {
      subscribe: () => pubsub.asyncIterator([TOPICS.PEDIDO_ACTUALIZADO])
    },
    stockActualizado: {
      subscribe: () => pubsub.asyncIterator([TOPICS.STOCK_ACTUALIZADO])
    }
  }
};
