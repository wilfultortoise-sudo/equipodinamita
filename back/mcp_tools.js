import { dbRepo } from './db.js';
import { mongoReviews, mongoAudit } from './mongodb.js';

export const MCP_TOOLS_DEFINITIONS = [
  {
    name: 'search_books',
    description: 'Busca libros en el catálogo de BiblioTech por título, autor, descripción o categoría.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Término de búsqueda (título, autor o palabra clave)' },
        categoriaId: { type: 'string', description: 'ID de categoría (1: Ciencia Ficción, 2: Fantasía, 3: Terror, 4: Desarrollo Web)' },
        limite: { type: 'number', description: 'Máximo número de libros a retornar (default 10)' }
      }
    }
  },
  {
    name: 'check_stock',
    description: 'Verifica la disponibilidad, precio e inventario en tiempo real de un libro por ID o título.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID numérico del libro en catálogo' },
        titulo: { type: 'string', description: 'Título o nombre aproximado del libro' }
      }
    }
  },
  {
    name: 'get_order_status',
    description: 'Consulta el estado actual, artículos y detalles de entrega de un pedido mediante su Folio.',
    parameters: {
      type: 'object',
      properties: {
        folio: { type: 'string', description: 'Folio oficial de la orden (ej. FOL-MVZO7J0U-745)' }
      },
      required: ['folio']
    }
  },
  {
    name: 'get_store_kpis',
    description: 'Obtiene las métricas financieras y operativas en tiempo real de BiblioTech Store.',
    parameters: { type: 'object', properties: {} }
  }
];

export async function executeMcpTool(name, args = {}) {
  switch (name) {
    case 'search_books': {
      const libros = dbRepo.getProductos({
        busqueda: args.query,
        categoriaId: args.categoriaId ? Number(args.categoriaId) : undefined,
        limite: args.limite || 10
      });

      if (!libros || libros.length === 0) {
        return {
          found: 0,
          message: `No se encontraron libros para "${args.query || ''}".`,
          results: []
        };
      }

      return {
        found: libros.length,
        results: libros.map(l => ({
          id: l.id,
          titulo: l.titulo,
          autor: l.autor,
          precio: l.precio,
          stock: l.stock,
          rating: l.rating,
          categoriaId: l.categoriaId,
          isbn: l.isbn
        }))
      };
    }

    case 'check_stock': {
      let libro = null;
      if (args.id) {
        libro = dbRepo.getProductoById(args.id);
      } else if (args.titulo) {
        const matches = dbRepo.getProductos({ busqueda: args.titulo, limite: 1 });
        libro = matches?.[0] || null;
      }

      if (!libro) {
        return {
          found: false,
          message: `Libro no encontrado (${args.id ? `ID ${args.id}` : `título "${args.titulo}"`}).`
        };
      }

      return {
        found: true,
        id: libro.id,
        titulo: libro.titulo,
        autor: libro.autor,
        stock: libro.stock,
        disponible: libro.stock > 0,
        precio: libro.precio,
        editorial: libro.editorial,
        isbn: libro.isbn
      };
    }

    case 'get_order_status': {
      if (!args.folio) {
        throw new Error('El parámetro "folio" es obligatorio.');
      }

      const pedidos = dbRepo.getPedidos();
      const pedido = pedidos.find(p => p.folio && p.folio.toUpperCase() === args.folio.trim().toUpperCase());

      if (!pedido) {
        return {
          found: false,
          message: `No se encontró ninguna orden con el folio "${args.folio}".`
        };
      }

      const detalles = dbRepo.getDetallesByPedidoId(pedido.id);
      const items = detalles.map(d => {
        const prod = dbRepo.getProductoById(d.productoId);
        return {
          productoId: d.productoId,
          titulo: prod ? prod.titulo : `ID ${d.productoId}`,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal
        };
      });

      const auditoria = await mongoAudit.getByFolio(pedido.folio);

      return {
        found: true,
        folio: pedido.folio,
        fecha: pedido.fecha,
        status: pedido.status,
        cliente: pedido.nombreCliente,
        email: pedido.emailCliente,
        direccionEnvio: pedido.direccionEnvio,
        metodoPago: pedido.metodoPago,
        referenciaPago: pedido.referenciaPago,
        total: pedido.total,
        items,
        trazabilidadMongoDB: auditoria
      };
    }

    case 'get_store_kpis': {
      return dbRepo.getAdminKPIs();
    }

    default:
      throw new Error(`Herramienta MCP "${name}" no reconocida. Herramientas válidas: ${MCP_TOOLS_DEFINITIONS.map(t => t.name).join(', ')}`);
  }
}
