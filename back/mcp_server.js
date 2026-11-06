#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { dbRepo, initDB } from './db.js';
import { mongoReviews, mongoAudit, initMongoDB } from './mongodb.js';

// Inicializar bases de datos antes de responder solicitudes MCP
initDB();
await initMongoDB();

// Crear servidor MCP oficial de BiblioTech Store
const server = new McpServer({
  name: 'bibliotech-ecommerce-mcp',
  version: '1.0.0'
});

// ============================================================
// HERRAMIENTA 1: search_books
// Permite al asistente de IA buscar libros en el catálogo
// ============================================================
server.registerTool(
  'search_books',
  {
    description: 'Busca libros en el catálogo de BiblioTech por título, autor, descripción o categoría.',
    inputSchema: z.object({
      query: z.string().optional().describe('Término de búsqueda (título, autor o palabra clave, ej. "Dune", "García Márquez")'),
      categoriaId: z.string().optional().describe('ID opcional de la categoría (1: Ciencia Ficción, 2: Fantasía, 3: Terror, 4: Desarrollo Web)'),
      limite: z.number().int().positive().optional().describe('Límite máximo de libros a retornar (por defecto 10)')
    })
  },
  async ({ query, categoriaId, limite }) => {
    try {
      const libros = dbRepo.getProductos({
        busqueda: query,
        categoriaId: categoriaId ? Number(categoriaId) : undefined,
        limite: limite || 10
      });

      if (!libros || libros.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No se encontraron libros que coincidan con la búsqueda "${query || ''}".`
          }]
        };
      }

      const formatted = libros.map(l => ({
        id: l.id,
        titulo: l.titulo,
        autor: l.autor,
        precio: `$${l.precio.toFixed(2)} MXN`,
        stock: l.stock,
        rating: `⭐ ${l.rating || 4.8} (${l.resenasCount || 0} reseñas)`,
        categoriaId: l.categoriaId,
        isbn: l.isbn || 'N/A'
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(formatted, null, 2)
        }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error al buscar libros: ${err.message}` }]
      };
    }
  }
);

// ============================================================
// HERRAMIENTA 2: check_stock
// Permite verificar la disponibilidad y precio de un libro
// ============================================================
server.registerTool(
  'check_stock',
  {
    description: 'Verifica la disponibilidad, precio e inventario en tiempo real de un libro por su ID o título.',
    inputSchema: z.object({
      id: z.string().optional().describe('ID numérico del libro en el catálogo (ej. "1", "2")'),
      titulo: z.string().optional().describe('Título o nombre aproximado del libro')
    })
  },
  async ({ id, titulo }) => {
    try {
      let libro = null;

      if (id) {
        libro = dbRepo.getProductoById(id);
      } else if (titulo) {
        const matches = dbRepo.getProductos({ busqueda: titulo, limite: 1 });
        libro = matches?.[0] || null;
      }

      if (!libro) {
        return {
          content: [{
            type: 'text',
            text: `No se encontró ningún libro con ${id ? `ID ${id}` : `título "${titulo}"`}.`
          }]
        };
      }

      const status = libro.stock > 0
        ? `✅ DISPONIBLE (${libro.stock} unidades en almacén)`
        : '❌ AGOTADO TEMPORALMENTE';

      const response = {
        id: libro.id,
        titulo: libro.titulo,
        autor: libro.autor,
        stockActual: libro.stock,
        estadoInventario: status,
        precioUnitario: `$${libro.precio.toFixed(2)} MXN`,
        precioAnterior: libro.precioAnterior ? `$${libro.precioAnterior.toFixed(2)} MXN` : null,
        editorial: libro.editorial || 'No especificada',
        isbn: libro.isbn || 'No registrado'
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error al verificar stock: ${err.message}` }]
      };
    }
  }
);

// ============================================================
// HERRAMIENTA 3: get_order_status
// Permite rastrear el estado y detalles de un pedido por Folio
// ============================================================
server.registerTool(
  'get_order_status',
  {
    description: 'Consulta el estado actual, artículos y detalles de entrega de un pedido mediante su Folio.',
    inputSchema: z.object({
      folio: z.string().describe('Folio oficial de la orden (ej. "FOL-MVZO7J0U-745")')
    })
  },
  async ({ folio }) => {
    try {
      const pedidos = dbRepo.getPedidos();
      const pedido = pedidos.find(p => p.folio && p.folio.toUpperCase() === folio.trim().toUpperCase());

      if (!pedido) {
        return {
          content: [{
            type: 'text',
            text: `No se encontró ninguna orden con el folio "${folio}". Verifica que el formato sea correcto.`
          }]
        };
      }

      const detalles = dbRepo.getDetallesByPedidoId(pedido.id);
      const items = detalles.map(d => {
        const prod = dbRepo.getProductoById(d.productoId);
        return {
          producto: prod ? prod.titulo : `ID ${d.productoId}`,
          cantidad: d.cantidad,
          precioUnitario: `$${d.precioUnitario.toFixed(2)} MXN`,
          subtotal: `$${d.subtotal.toFixed(2)} MXN`
        };
      });

      // Consultar historial de auditoría NoSQL en MongoDB
      const auditoria = await mongoAudit.getByFolio(pedido.folio);

      const response = {
        folio: pedido.folio,
        fecha: pedido.fecha,
        estado: pedido.status,
        cliente: pedido.nombreCliente,
        email: pedido.emailCliente,
        direccionEntrega: pedido.direccionEnvio,
        metodoPago: pedido.metodoPago,
        referenciaPago: pedido.referenciaPago || 'N/A',
        total: `$${pedido.total.toFixed(2)} MXN`,
        articulos: items,
        historialEventosMongoDB: auditoria.map(a => `${a.fecha}: [${a.evento}] ${a.detalles}`)
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error al consultar pedido: ${err.message}` }]
      };
    }
  }
);

// ============================================================
// HERRAMIENTA 4 (BONUS): get_store_kpis
// Estadísticas del e-commerce para agentes inteligentes
// ============================================================
server.registerTool(
  'get_store_kpis',
  {
    description: 'Obtiene las métricas financieras y operativas en tiempo real de BiblioTech Store.',
    inputSchema: z.object({})
  },
  async () => {
    try {
      const kpis = dbRepo.getAdminKPIs();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(kpis, null, 2)
        }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error al obtener KPIs: ${err.message}` }]
      };
    }
  }
);

// Iniciar servidor MCP con transporte de entrada/salida estándar (Stdio)
const transport = new StdioServerTransport();
await server.connect(transport);
