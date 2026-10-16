export const typeDefs = `#graphql
  """Categoria a la que pertenecen los libros"""
  type Categoria {
    id: ID!
    nombre: String!
    descripcion: String
    icono: String
    slug: String
    productos: [Producto!]!
  }

  """Libro o producto del catalogo"""
  type Producto {
    id: ID!
    titulo: String!
    autor: String!
    isbn: String
    editorial: String
    precio: Float!
    precioAnterior: Float
    imagen: String
    categoriaId: ID!
    categoria: Categoria
    stock: Int!
    descripcion: String
    paginas: Int
    rating: Float
    resenasCount: Int
    destacado: Boolean
  }

  """Roles de usuario en la plataforma"""
  enum Rol {
    CLIENTE
    ADMIN
    VENDEDOR
  }

  """Usuario registrado en el e-commerce"""
  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    rol: Rol!
    telefono: String
    direccion: String
    pedidos: [Pedido!]!
  }

  """Estados del ciclo de vida de un pedido"""
  enum StatusPedido {
    PENDIENTE
    PAGADO
    PREPARANDO
    ENVIADO
    ENTREGADO
    CANCELADO
  }

  """Metodos de pago soportados"""
  enum MetodoPago {
    TARJETA_CREDITO
    TARJETA_DEBITO
    MERCADO_PAGO
    PAYPAL
    OXXO_EFECTIVO
    TRANSFERENCIA_SPEI
  }

  """Detalle individual de linea en un pedido"""
  type DetallePedido {
    id: ID!
    pedidoId: ID!
    productoId: ID!
    producto: Producto!
    cantidad: Int!
    precioUnitario: Float!
    subtotal: Float!
  }

  """Pedido u orden de compra registrada"""
  type Pedido {
    id: ID!
    folio: String!
    fecha: String!
    subtotal: Float!
    envio: Float!
    total: Float!
    status: StatusPedido!
    metodoPago: String!
    direccionEnvio: String!
    nombreCliente: String!
    emailCliente: String!
    usuarioId: ID
    detallesPago: String
    referenciaPago: String
    usuario: Usuario
    detalles: [DetallePedido!]!
  }

  """Input para crear o actualizar libros"""
  input ProductoInput {
    titulo: String!
    autor: String!
    isbn: String
    editorial: String
    precio: Float!
    precioAnterior: Float
    imagen: String
    categoriaId: ID!
    stock: Int!
    descripcion: String
    paginas: Int
    rating: Float
    resenasCount: Int
    destacado: Boolean
  }

  """Item individual al armar un pedido"""
  input ItemPedidoInput {
    productoId: ID!
    cantidad: Int!
  }

  """Input para la mutacion de negocio crearPedido"""
  input PedidoInput {
    items: [ItemPedidoInput!]!
    metodoPago: MetodoPago!
    direccionEnvio: String!
    nombreCliente: String!
    emailCliente: String!
    usuarioId: ID
    detallesPago: String
    referenciaPago: String
  }

  """Indicadores principales del panel administrativo"""
  type AdminKPIs {
    ventasTotales: Float!
    totalPedidos: Int!
    totalClientes: Int!
    totalProductos: Int!
    pedidosPendientes: Int!
    pedidosPreparando: Int!
    pedidosEnviados: Int!
    pedidosEntregados: Int!
  }

  """Respuesta de autenticacion con token Bearer y datos del usuario"""
  type AuthPayload {
    token: String!
    usuario: Usuario!
  }

  type Query {
    """Obtiene los indicadores principales del panel administrativo"""
    adminKPIs: AdminKPIs!

    """Obtiene libros con filtros opcionales de categoria, busqueda y paginacion"""
    productos(categoriaId: ID, busqueda: String, limite: Int, desde: Int): [Producto!]!

    """Obtiene un libro especifico por ID"""
    producto(id: ID!): Producto

    """Obtiene todas las categorias disponibles"""
    categorias: [Categoria!]!

    """Obtiene una categoria por ID"""
    categoria(id: ID!): Categoria

    """Obtiene todos los usuarios del sistema"""
    usuarios: [Usuario!]!

    """Obtiene un usuario por ID"""
    usuario(id: ID!): Usuario

    """Obtiene el usuario actualmente autenticado mediante el Bearer token"""
    me: Usuario

    """Obtiene la lista de pedidos registrados"""
    pedidos: [Pedido!]!

    """Obtiene los pedidos del usuario autenticado"""
    misPedidos: [Pedido!]!

    """Obtiene un pedido especifico por ID o folio"""
    pedido(id: ID!): Pedido
  }

  type Mutation {
    """Inicia sesion con credenciales y devuelve el token Bearer"""
    login(email: String!, password: String!): AuthPayload!

    """Registra una nueva cuenta de usuario y devuelve el token Bearer"""
    registro(nombre: String!, email: String!, password: String!, telefono: String, direccion: String): AuthPayload!

    """Crea un nuevo libro en el catalogo (CRUD Create)"""
    crearProducto(datos: ProductoInput!): Producto!

    """Actualiza la informacion de un libro (CRUD Update)"""
    actualizarProducto(id: ID!, datos: ProductoInput!): Producto!

    """Actualiza rapidamente el stock de un libro en inventario"""
    actualizarStock(id: ID!, stock: Int!): Producto!

    """Elimina un libro del catalogo (CRUD Delete)"""
    eliminarProducto(id: ID!): Boolean!

    """Mutacion de negocio: Registra una orden de compra, valida stock y descuenta inventario"""
    crearPedido(datos: PedidoInput!): Pedido!

    """Actualiza el estado de un pedido"""
    actualizarEstadoPedido(id: ID!, status: StatusPedido!): Pedido!
  }

  type Subscription {
    """Notifica en tiempo real cuando un cliente realiza una compra"""
    pedidoCreado: Pedido!

    """Notifica en tiempo real cuando cambia el estado de una orden"""
    pedidoActualizado: Pedido!

    """Notifica en tiempo real cuando se modifica el stock de un libro"""
    stockActualizado: Producto!
  }
`;
