from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(500), nullable=True)
    icono = Column(String(50), nullable=True)
    slug = Column(String(100), nullable=True)

    productos = relationship("Producto", back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(255), nullable=False)
    autor = Column(String(150), nullable=True)
    isbn = Column(String(30), nullable=True)
    editorial = Column(String(100), nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    precioAnterior = Column(Numeric(10, 2), nullable=True)
    imagen = Column(String(500), nullable=True)
    categoriaId = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    stock = Column(Integer, nullable=False, default=0)
    descripcion = Column(String(1000), nullable=True)
    paginas = Column(Integer, nullable=True, default=300)
    rating = Column(Numeric(3, 1), nullable=True, default=4.8)
    resenasCount = Column(Integer, nullable=True, default=12)
    destacado = Column(Integer, nullable=True, default=0)

    categoria = relationship("Categoria", back_populates="productos")
    detalles = relationship("DetallePedido", back_populates="producto")

    @property
    def nombre(self):
        return self.titulo

    @property
    def categoria_id(self):
        return self.categoriaId


class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=True)
    rol = Column(String(20), nullable=False, default="CLIENTE")
    telefono = Column(String(30), nullable=True)
    direccion = Column(String(300), nullable=True)

    pedidos = relationship("Pedido", back_populates="usuario")


class Pedido(Base):
    __tablename__ = "pedidos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    folio = Column(String(50), nullable=False, default="PED-2026-000")
    fecha = Column(String(100), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    envio = Column(Numeric(10, 2), nullable=False, default=0.0)
    total = Column(Numeric(10, 2), nullable=False)
    status = Column(String(30), nullable=False, default="PENDIENTE")
    metodoPago = Column(String(50), nullable=False, default="TARJETA_CREDITO")
    direccionEnvio = Column(String(300), nullable=False, default="Guadalajara, Jalisco")
    nombreCliente = Column(String(150), nullable=False, default="Cliente")
    emailCliente = Column(String(150), nullable=False, default="cliente@ecommerce.com")
    usuarioId = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    usuario = relationship("Usuario", back_populates="pedidos")
    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")


class DetallePedido(Base):
    __tablename__ = "detalles_pedido"
    id = Column(Integer, primary_key=True, autoincrement=True)
    pedidoId = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    productoId = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precioUnitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles")
