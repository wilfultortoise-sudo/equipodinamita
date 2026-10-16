import { dbRepo } from './db.js';

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
  // PRODUCTO
  // ==========================================================
  Producto: {
    categoria: (parent) => {
      return dbRepo.getCategoriaById(parent.categoriaId);
    }
  },

  // ==========================================================
  // CATEGORIA
  // ==========================================================
  Categoria: {
    productos: (parent) => {
      return dbRepo.getProductosByCategoriaId(parent.id);
    }
  },

  // ==========================================================
  // USUARIO
  // ==========================================================
  Usuario: {
    pedidos: (parent) => {
      return dbRepo.getPedidosByUsuarioId(parent.id);
    }
  },

  // ==========================================================
  // PEDIDO
  // ==========================================================
  Pedido: {
    usuario: (parent) => {
      if (!parent.usuarioId) {
        return null;
      }
      return dbRepo.getUsuarioById(parent.usuarioId);
    },

    detalles: (parent) => {
      return dbRepo.getDetallesByPedidoId(parent.id);
    }
  },

  // ==========================================================
  // DETALLE DE PEDIDO
  // ==========================================================
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
      return dbRepo.crearProducto(datos);
    },

    actualizarProducto: (_, { id, datos }) => {
      return dbRepo.actualizarProducto(id, datos);
    },

    actualizarStock: (_, { id, stock }) => {
      return dbRepo.actualizarStock(id, stock);
    },

    eliminarProducto: (_, { id }, context) => {
      requireAdmin(context);
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
