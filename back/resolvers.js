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

    adminKPIs: (_, __, context) => {

      requireAdmin(context);

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


    // --------------------------------------------------------
    // USUARIOS
    // Solo ADMIN puede consultar todos los usuarios
    // --------------------------------------------------------

    usuarios: (_, __, context) => {
      requireAdmin(context);

      return dbRepo.getUsuarios();
    },

    // Un usuario puede consultar su propio registro.
    // ADMIN puede consultar cualquier usuario.
    usuario: (_, { id }, context) => {

      const user = requireAuth(context);

      if (user.rol !== 'ADMIN' && Number(user.id) !== Number(id)) {
        throw new Error(
          'Acceso denegado: no puedes consultar la información de otro usuario.'
        );
      }

      return dbRepo.getUsuarioById(id);
    },


    // --------------------------------------------------------
    // USUARIO ACTUAL
    // --------------------------------------------------------

    me: (_, __, context) => {
      return context?.currentUser || null;
    },


    // --------------------------------------------------------
    // PEDIDOS
    // --------------------------------------------------------
    // IMPORTANTE:
    // "pedidos" es una consulta administrativa.
    // Solo ADMIN puede obtener TODOS los pedidos.
    // --------------------------------------------------------

    pedidos: (_, __, context) => {

      requireAdmin(context);

      return dbRepo.getPedidos();
    },


    // --------------------------------------------------------
    // PEDIDOS DEL USUARIO ACTUAL
    // --------------------------------------------------------

    misPedidos: (_, __, context) => {

      const user = requireAuth(context);

      return dbRepo.getPedidosByUsuarioId(user.id);
    },


    // --------------------------------------------------------
    // PEDIDO INDIVIDUAL
    // --------------------------------------------------------
    // ADMIN puede consultar cualquiera.
    // CLIENTE solamente sus propios pedidos.
    // --------------------------------------------------------

    pedido: (_, { id }, context) => {

      const user = requireAuth(context);

      const pedido = dbRepo.getPedidoById(id);

      if (!pedido) {
        return null;
      }

      if (
        user.rol !== 'ADMIN' &&
        Number(pedido.usuarioId) !== Number(user.id)
      ) {
        throw new Error(
          'Acceso denegado: no puedes consultar este pedido.'
        );
      }

      return pedido;
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

    pedidos: (parent, _, context) => {

      const user = requireAuth(context);

      // ADMIN puede consultar los pedidos de cualquier usuario.
      if (user.rol === 'ADMIN') {
        return dbRepo.getPedidosByUsuarioId(parent.id);
      }

      // CLIENTE solamente puede consultar sus propios pedidos.
      if (Number(user.id) !== Number(parent.id)) {
        throw new Error(
          'Acceso denegado: no puedes consultar los pedidos de otro usuario.'
        );
      }

      return dbRepo.getPedidosByUsuarioId(parent.id);
    }
  },


  // ==========================================================
  // PEDIDO
  // ==========================================================

  Pedido: {

    usuario: (parent, _, context) => {

      const user = requireAuth(context);

      if (
        user.rol !== 'ADMIN' &&
        Number(parent.usuarioId) !== Number(user.id)
      ) {
        throw new Error(
          'Acceso denegado: no puedes consultar el usuario de este pedido.'
        );
      }

      if (!parent.usuarioId) {
        return null;
      }

      return dbRepo.getUsuarioById(parent.usuarioId);
    },

    detalles: (parent, _, context) => {

      requireAuth(context);

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

    // --------------------------------------------------------
    // LOGIN
    // Público
    // --------------------------------------------------------

    login: (_, { email, password }) => {

      return dbRepo.loginUsuario(email, password);
    },


    // --------------------------------------------------------
    // REGISTRO
    // Público
    // --------------------------------------------------------

    registro: (_, {
      nombre,
      email,
      password,
      telefono,
      direccion
    }) => {

      return dbRepo.registroUsuario({
        nombre,
        email,
        password,
        telefono,
        direccion
      });
    },


    // --------------------------------------------------------
    // PRODUCTOS
    // SOLO ADMIN
    // --------------------------------------------------------

    crearProducto: (_, { datos }, context) => {

      requireAdmin(context);

      return dbRepo.crearProducto(datos);
    },


    actualizarProducto: (_, { id, datos }, context) => {

      requireAdmin(context);

      return dbRepo.actualizarProducto(id, datos);
    },


    eliminarProducto: (_, { id }, context) => {

      requireAdmin(context);

      return dbRepo.eliminarProducto(id);
    },


    // --------------------------------------------------------
    // CREAR PEDIDO
    // CLIENTE AUTENTICADO
    // --------------------------------------------------------

    crearPedido: (_, { datos }, context) => {

      const user = requireAuth(context);

  // El usuarioId enviado por el frontend NO se utiliza.
  // El backend siempre toma el usuario autenticado.
        datos.usuarioId = user.id;

  // También usamos los datos reales de la sesión.
        datos.nombreCliente = user.nombre;
        datos.emailCliente = user.email;

      return dbRepo.crearPedido(datos);
    },


    // --------------------------------------------------------
    // ACTUALIZAR ESTADO DEL PEDIDO
    // SOLO ADMIN
    // --------------------------------------------------------

    actualizarEstadoPedido: (_, { id, status }, context) => {

      requireAdmin(context);

      const pedido = dbRepo.getPedidoById(id);

      if (!pedido) {
        throw new Error(
          `El pedido con ID ${id} no existe.`
        );
      }

      return dbRepo.actualizarEstadoPedido(id, status);
    }
  }
};