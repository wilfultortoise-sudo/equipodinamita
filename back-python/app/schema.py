import enum
from decimal import Decimal
from typing import List, Optional
import time
import random
import datetime

import strawberry
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Categoria as CategoriaModel
from .models import Producto as ProductoModel
from .models import Usuario as UsuarioModel
from .models import Pedido as PedidoModel
from .models import DetallePedido as DetallePedidoModel


@strawberry.enum
class Rol(enum.Enum):
    CLIENTE = "CLIENTE"
    ADMIN = "ADMIN"
    VENDEDOR = "VENDEDOR"


@strawberry.enum
class StatusPedido(enum.Enum):
    PENDIENTE = "PENDIENTE"
    PAGADO = "PAGADO"
    PREPARANDO = "PREPARANDO"
    ENVIADO = "ENVIADO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"


@strawberry.enum
class MetodoPago(enum.Enum):
    TARJETA_CREDITO = "TARJETA_CREDITO"
    TARJETA_DEBITO = "TARJETA_DEBITO"
    MERCADO_PAGO = "MERCADO_PAGO"
    PAYPAL = "PAYPAL"
    OXXO_EFECTIVO = "OXXO_EFECTIVO"
    TRANSFERENCIA_SPEI = "TRANSFERENCIA_SPEI"


@strawberry.type(description="Categoría a la que pertenecen los libros")
class Categoria:
    id: strawberry.ID
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    slug: Optional[str] = None

    @strawberry.field
    def productos(self) -> List["Producto"]:
        with SessionLocal() as db:
            rows = db.scalars(
                select(ProductoModel).where(ProductoModel.categoriaId == int(self.id))
            ).all()
            return [producto_from_model(p) for p in rows]


@strawberry.type(description="Libro o producto del catálogo")
class Producto:
    id: strawberry.ID
    titulo: str
    autor: Optional[str] = None
    isbn: Optional[str] = None
    editorial: Optional[str] = None
    precio: float
    precioAnterior: Optional[float] = None
    imagen: Optional[str] = None
    categoriaId: strawberry.ID
    stock: int
    descripcion: Optional[str] = None
    paginas: Optional[int] = 300
    rating: Optional[float] = 4.8
    resenasCount: Optional[int] = 12
    destacado: Optional[bool] = False

    @strawberry.field
    def nombre(self) -> str:
        return self.titulo

    @strawberry.field
    def categoria(self) -> Optional[Categoria]:
        if not self.categoriaId:
            return None
        with SessionLocal() as db:
            c = db.get(CategoriaModel, int(self.categoriaId))
            return categoria_from_model(c) if c else None


@strawberry.type(description="Detalle individual de línea en un pedido")
class DetallePedido:
    id: strawberry.ID
    pedidoId: strawberry.ID
    productoId: strawberry.ID
    cantidad: int
    precioUnitario: float
    subtotal: float

    @strawberry.field
    def producto(self) -> Optional[Producto]:
        with SessionLocal() as db:
            p = db.get(ProductoModel, int(self.productoId))
            return producto_from_model(p) if p else None


@strawberry.type(description="Pedido u orden de compra registrada")
class Pedido:
    id: strawberry.ID
    folio: str
    fecha: str
    subtotal: float
    envio: float
    total: float
    status: StatusPedido
    metodoPago: str
    direccionEnvio: str
    nombreCliente: str
    emailCliente: str
    usuarioId: Optional[strawberry.ID] = None

    @strawberry.field
    def detalles(self) -> List[DetallePedido]:
        with SessionLocal() as db:
            rows = db.scalars(
                select(DetallePedidoModel).where(DetallePedidoModel.pedidoId == int(self.id))
            ).all()
            return [detalle_from_model(d) for d in rows]


@strawberry.type(description="Usuario registrado en el e-commerce")
class Usuario:
    id: strawberry.ID
    nombre: str
    email: str
    rol: Rol
    telefono: Optional[str] = None
    direccion: Optional[str] = None

    @strawberry.field
    def pedidos(self) -> List[Pedido]:
        with SessionLocal() as db:
            rows = db.scalars(
                select(PedidoModel).where(PedidoModel.usuarioId == int(self.id)).order_by(PedidoModel.id.desc())
            ).all()
            return [pedido_from_model(p) for p in rows]


@strawberry.type(description="Respuesta de autenticacion con token Bearer y datos del usuario")
class AuthPayload:
    token: str
    usuario: Usuario


def usuario_from_model(u: UsuarioModel) -> Usuario:
    r_val = Rol.CLIENTE
    try:
        r_val = Rol(u.rol)
    except:
        pass
    return Usuario(
        id=strawberry.ID(str(u.id)),
        nombre=u.nombre,
        email=u.email,
        rol=r_val,
        telefono=u.telefono,
        direccion=u.direccion
    )


def categoria_from_model(c: CategoriaModel) -> Categoria:
    return Categoria(
        id=strawberry.ID(str(c.id)),
        nombre=c.nombre,
        descripcion=c.descripcion,
        icono=c.icono,
        slug=c.slug
    )


def producto_from_model(p: ProductoModel) -> Producto:
    return Producto(
        id=strawberry.ID(str(p.id)),
        titulo=p.titulo or "",
        autor=p.autor or "",
        isbn=p.isbn or "",
        editorial=p.editorial or "",
        precio=float(p.precio),
        precioAnterior=float(p.precioAnterior) if p.precioAnterior else None,
        imagen=p.imagen or "",
        categoriaId=strawberry.ID(str(p.categoriaId or 1)),
        stock=int(p.stock),
        descripcion=p.descripcion or "",
        paginas=int(p.paginas or 300),
        rating=float(p.rating or 4.8),
        resenasCount=int(p.resenasCount or 12),
        destacado=bool(p.destacado)
    )


def detalle_from_model(d: DetallePedidoModel) -> DetallePedido:
    return DetallePedido(
        id=strawberry.ID(str(d.id)),
        pedidoId=strawberry.ID(str(d.pedidoId)),
        productoId=strawberry.ID(str(d.productoId)),
        cantidad=int(d.cantidad),
        precioUnitario=float(d.precioUnitario),
        subtotal=float(d.subtotal)
    )


def pedido_from_model(p: PedidoModel) -> Pedido:
    st_val = StatusPedido.PENDIENTE
    try:
        st_val = StatusPedido(p.status)
    except:
        pass

    return Pedido(
        id=strawberry.ID(str(p.id)),
        folio=p.folio or f"PED-2026-{p.id}",
        fecha=str(p.fecha or ""),
        subtotal=float(p.subtotal or 0.0),
        envio=float(p.envio or 0.0),
        total=float(p.total or 0.0),
        status=st_val,
        metodoPago=p.metodoPago or "TARJETA_CREDITO",
        direccionEnvio=p.direccionEnvio or "",
        nombreCliente=p.nombreCliente or "",
        emailCliente=p.emailCliente or "",
        usuarioId=strawberry.ID(str(p.usuarioId)) if p.usuarioId else None
    )


@strawberry.input
class ItemPedidoInput:
    productoId: strawberry.ID
    cantidad: int


@strawberry.input
class PedidoInput:
    items: Optional[List[ItemPedidoInput]] = None
    metodoPago: Optional[MetodoPago] = MetodoPago.TARJETA_CREDITO
    direccionEnvio: Optional[str] = "Guadalajara, Jalisco"
    nombreCliente: Optional[str] = "Cliente General"
    emailCliente: Optional[str] = "cliente@ecommerce.com"
    usuarioId: Optional[strawberry.ID] = None
    # Backwards compatibility with simple schema from ENTREGA-P2-6
    usuario_id: Optional[int] = None
    producto_ids: Optional[List[int]] = None


@strawberry.input
class ProductoInput:
    titulo: str
    autor: Optional[str] = ""
    isbn: Optional[str] = ""
    editorial: Optional[str] = ""
    precio: float
    precioAnterior: Optional[float] = None
    imagen: Optional[str] = ""
    categoriaId: strawberry.ID
    stock: int = 10
    descripcion: Optional[str] = ""
    paginas: Optional[int] = 300
    rating: Optional[float] = 4.8
    resenasCount: Optional[int] = 12
    destacado: Optional[bool] = False
    # Backwards compatibility
    nombre: Optional[str] = None
    categoria_id: Optional[int] = None


@strawberry.type
class Query:
    @strawberry.field(description="Obtiene libros con filtros opcionales de categoría y búsqueda")
    def productos(
        self,
        categoriaId: Optional[strawberry.ID] = None,
        busqueda: Optional[str] = None,
        limite: Optional[int] = None,
        desde: Optional[int] = None
    ) -> List[Producto]:
        with SessionLocal() as db:
            stmt = select(ProductoModel)
            if categoriaId:
                stmt = stmt.where(ProductoModel.categoriaId == int(categoriaId))
            if busqueda and busqueda.strip():
                term = f"%{busqueda.strip()}%"
                stmt = stmt.where(
                    (ProductoModel.titulo.ilike(term)) |
                    (ProductoModel.autor.ilike(term)) |
                    (ProductoModel.descripcion.ilike(term))
                )
            stmt = stmt.order_by(ProductoModel.destacado.desc(), ProductoModel.id.asc())
            rows = db.scalars(stmt).all()
            if desde is not None:
                rows = rows[desde:]
            if limite is not None:
                rows = rows[:limite]
            return [producto_from_model(p) for p in rows]

    @strawberry.field(description="Obtiene un libro específico por ID")
    def producto(self, id: strawberry.ID) -> Optional[Producto]:
        with SessionLocal() as db:
            p = db.get(ProductoModel, int(id))
            return producto_from_model(p) if p else None

    @strawberry.field(description="Obtiene todas las categorías disponibles")
    def categorias(self) -> List[Categoria]:
        with SessionLocal() as db:
            rows = db.scalars(select(CategoriaModel).order_by(CategoriaModel.id.asc())).all()
            return [categoria_from_model(c) for c in rows]

    @strawberry.field(description="Obtiene una categoría por ID")
    def categoria(self, id: strawberry.ID) -> Optional[Categoria]:
        with SessionLocal() as db:
            c = db.get(CategoriaModel, int(id))
            return categoria_from_model(c) if c else None

    @strawberry.field(description="Obtiene la lista de pedidos registrados")
    def pedidos(self) -> List[Pedido]:
        with SessionLocal() as db:
            rows = db.scalars(select(PedidoModel).order_by(PedidoModel.id.desc())).all()
            return [pedido_from_model(p) for p in rows]

    @strawberry.field(description="Obtiene un pedido específico por ID")
    def pedido(self, id: strawberry.ID) -> Optional[Pedido]:
        with SessionLocal() as db:
            p = db.get(PedidoModel, int(id))
            return pedido_from_model(p) if p else None

    @strawberry.field(description="Obtiene todos los usuarios")
    def usuarios(self) -> List[Usuario]:
        with SessionLocal() as db:
            rows = db.scalars(select(UsuarioModel).order_by(UsuarioModel.id.asc())).all()
            return [usuario_from_model(u) for u in rows]

    @strawberry.field(description="Obtiene un usuario por ID")
    def usuario(self, id: strawberry.ID) -> Optional[Usuario]:
        with SessionLocal() as db:
            u = db.get(UsuarioModel, int(id))
            return usuario_from_model(u) if u else None

    @strawberry.field(description="Obtiene el usuario actualmente autenticado")
    def me(self) -> Optional[Usuario]:
        with SessionLocal() as db:
            u = db.get(UsuarioModel, 1)
            return usuario_from_model(u) if u else None

    @strawberry.field(description="Obtiene las órdenes del usuario")
    def mis_pedidos(self) -> List[Pedido]:
        with SessionLocal() as db:
            rows = db.scalars(select(PedidoModel).order_by(PedidoModel.id.desc())).all()
            return [pedido_from_model(p) for p in rows]


@strawberry.type
class Mutation:
    @strawberry.mutation(description="Iniciar sesion de usuario")
    def login(self, email: str, password: str) -> AuthPayload:
        with SessionLocal() as db:
            u = db.scalar(select(UsuarioModel).where(UsuarioModel.email == email.strip().lower()))
            if not u:
                raise ValueError("Credenciales incorrectas: no existe usuario con ese correo.")
            token = f"fake_token_{u.id}_{int(time.time())}"
            return AuthPayload(token=token, usuario=usuario_from_model(u))

    @strawberry.mutation(description="Registrar nueva cuenta de usuario")
    def registro(self, nombre: str, email: str, password: str, telefono: Optional[str] = None, direccion: Optional[str] = None) -> AuthPayload:
        with SessionLocal() as db:
            exist = db.scalar(select(UsuarioModel).where(UsuarioModel.email == email.strip().lower()))
            if exist:
                raise ValueError("El correo ya está registrado.")
            new_u = UsuarioModel(
                nombre=nombre.strip(),
                email=email.strip().lower(),
                password=password,
                rol="CLIENTE",
                telefono=telefono,
                direccion=direccion
            )
            db.add(new_u)
            db.commit()
            db.refresh(new_u)
            token = f"fake_token_{new_u.id}_{int(time.time())}"
            return AuthPayload(token=token, usuario=usuario_from_model(new_u))

    @strawberry.mutation(description="Mutación de negocio: Valida existencias, descuenta stock y registra la orden")
    def crear_pedido(self, datos: PedidoInput) -> Pedido:
        with SessionLocal() as db:
            items_list = []
            if datos.items:
                for it in datos.items:
                    items_list.append((int(it.productoId), int(it.cantidad)))
            elif datos.producto_ids:
                counts = {}
                for pid in datos.producto_ids:
                    counts[pid] = counts.get(pid, 0) + 1
                for pid, qty in counts.items():
                    items_list.append((int(pid), qty))
            else:
                raise ValueError("El pedido debe contener al menos un producto.")

            # Validar stock y productos
            subtotal = Decimal("0")
            validados = []
            for pid, qty in items_list:
                prod = db.get(ProductoModel, pid)
                if not prod:
                    raise ValueError(f"Producto con ID {pid} no encontrado en catálogo.")
                if prod.stock < qty:
                    raise ValueError(f"Stock insuficiente para '{prod.titulo}'. Solicitado: {qty}, Disponible: {prod.stock}")
                item_sub = prod.precio * Decimal(str(qty))
                subtotal += item_sub
                validados.append((prod, qty, item_sub))

            envio = Decimal("0") if subtotal > Decimal("999") or subtotal == Decimal("0") else Decimal("99")
            total = subtotal + envio
            folio = f"PED-{datetime.datetime.now().strftime('%Y')}-{random.randint(100, 999)}"
            fecha = datetime.datetime.now().isoformat()

            uid = int(datos.usuarioId) if datos.usuarioId else (datos.usuario_id or 1)
            mp = datos.metodoPago.value if hasattr(datos.metodoPago, "value") else str(datos.metodoPago or "TARJETA_CREDITO")

            pedido_db = PedidoModel(
                folio=folio,
                fecha=fecha,
                subtotal=subtotal,
                envio=envio,
                total=total,
                status="PAGADO",
                metodoPago=mp,
                direccionEnvio=datos.direccionEnvio or "Guadalajara, Jalisco",
                nombreCliente=datos.nombreCliente or "Cliente General",
                emailCliente=datos.emailCliente or "cliente@ecommerce.com",
                usuarioId=uid
            )
            db.add(pedido_db)
            db.flush()

            for prod, qty, item_sub in validados:
                prod.stock -= qty
                detalle = DetallePedidoModel(
                    pedidoId=pedido_db.id,
                    productoId=prod.id,
                    cantidad=qty,
                    precioUnitario=prod.precio,
                    subtotal=item_sub
                )
                db.add(detalle)

            db.commit()
            db.refresh(pedido_db)
            return pedido_from_model(pedido_db)


schema = strawberry.Schema(query=Query, mutation=Mutation)
