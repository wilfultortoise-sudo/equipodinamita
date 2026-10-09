import { dbRepo } from './db.js';

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
      return dbRepo.crearProducto(datos);
    },
    actualizarProducto: (_, { id, datos }) => {
      return dbRepo.actualizarProducto(id, datos);
    },
    actualizarStock: (_, { id, stock }) => {
      return dbRepo.actualizarStock(id, stock);
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
      return dbRepo.crearPedido(datos);
    },
    actualizarEstadoPedido: (_, { id, status }) => {
      return dbRepo.actualizarEstadoPedido(id, status);
    }
  }
};
