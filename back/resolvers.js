import { dbRepo } from './db.js';
import { pubsub, TOPICS } from './pubsub.js';
import { procesarPagoMercadoPago } from './mercadopago.js';

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

      // Validar pasarela Mercado Pago exclusivamente cuando el método de pago seleccionado es MERCADO_PAGO
      if (datos.metodoPago === 'MERCADO_PAGO') {
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

      return nuevoPedido;
    },

    actualizarEstadoPedido: (_, { id, status }) => {
      const pedidoActualizado = dbRepo.actualizarEstadoPedido(id, status);
      safePublish(TOPICS.PEDIDO_ACTUALIZADO, { pedidoActualizado });
      return pedidoActualizado;
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
