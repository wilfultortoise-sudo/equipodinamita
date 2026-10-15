import { dbRepo } from './db.js';
import { pubsub, TOPICS } from './pubsub.js';

export const resolvers = {
  Query: {
    productos: (_, { categoriaId, busqueda, limite, desde }) => {
      return dbRepo.getProductos({ categoriaId, busqueda, limite, desde });
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
    usuarios: () => {
      return dbRepo.getUsuarios();
    },
    usuario: (_, { id }) => {
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

  Producto: {
    categoria: (parent) => {
      return dbRepo.getCategoriaById(parent.categoriaId);
    }
  },

  Categoria: {
    productos: (parent) => {
      return dbRepo.getProductosByCategoriaId(parent.id);
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

  Mutation: {
    login: (_, { email, password }) => {
      return dbRepo.loginUsuario(email, password);
    },
    registro: (_, { nombre, email, password, telefono, direccion }) => {
      return dbRepo.registroUsuario({ nombre, email, password, telefono, direccion });
    },
    crearProducto: (_, { datos }) => {
      const nuevoProducto = dbRepo.crearProducto(datos);
      pubsub.publish(TOPICS.STOCK_ACTUALIZADO, { stockActualizado: nuevoProducto });
      return nuevoProducto;
    },
    actualizarProducto: (_, { id, datos }) => {
      const productoActualizado = dbRepo.actualizarProducto(id, datos);
      pubsub.publish(TOPICS.STOCK_ACTUALIZADO, { stockActualizado: productoActualizado });
      return productoActualizado;
    },
    actualizarStock: (_, { id, stock }) => {
      const productoActualizado = dbRepo.actualizarStock(id, stock);
      pubsub.publish(TOPICS.STOCK_ACTUALIZADO, { stockActualizado: productoActualizado });
      return productoActualizado;
    },
    eliminarProducto: (_, { id }) => {
      return dbRepo.eliminarProducto(id);
    },
    crearPedido: (_, { datos }, context) => {
      // Si hay usuario logueado en el contexto y no venia usuarioId, lo asignamos
      if (context?.currentUser) {
        datos.usuarioId = datos.usuarioId || context.currentUser.id;
        if (!datos.nombreCliente) datos.nombreCliente = context.currentUser.nombre;
        if (!datos.emailCliente) datos.emailCliente = context.currentUser.email;
      }
      const nuevoPedido = dbRepo.crearPedido(datos);

      // 1. Notificar inmediatamente la creación del pedido vía WebSocket
      pubsub.publish(TOPICS.PEDIDO_CREADO, { pedidoCreado: nuevoPedido });

      // 2. Notificar actualización de stock de cada producto involucrado
      if (datos?.items && Array.isArray(datos.items)) {
        for (const item of datos.items) {
          const productoAfectado = dbRepo.getProductoById(item.productoId);
          if (productoAfectado) {
            pubsub.publish(TOPICS.STOCK_ACTUALIZADO, { stockActualizado: productoAfectado });
          }
        }
      }

      return nuevoPedido;
    },
    actualizarEstadoPedido: (_, { id, status }) => {
      const pedidoActualizado = dbRepo.actualizarEstadoPedido(id, status);
      pubsub.publish(TOPICS.PEDIDO_ACTUALIZADO, { pedidoActualizado });
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

