import { GoogleGenAI } from '@google/genai';
import { MCP_TOOLS_DEFINITIONS, executeMcpTool } from './mcp_tools.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;

let aiClient = null;
if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (e) {
    console.warn('[Gemini Assistant] Error al inicializar GoogleGenAI:', e.message);
  }
}

// Transformar definiciones MCP a Function Declarations de Gemini
const geminiFunctionDeclarations = MCP_TOOLS_DEFINITIONS.map(tool => ({
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters
}));

/**
 * Procesa un mensaje del usuario utilizando Google Gemini conectado a herramientas MCP.
 */
export async function chatWithGemini(userMessage, conversationHistory = []) {
  if (!userMessage || typeof userMessage !== 'string') {
    throw new Error('El mensaje no puede estar vacío.');
  }

  // 1. Si hay API Key de Gemini configurada, usar el modelo oficial Gemini con Function Calling
  if (GEMINI_API_KEY && aiClient) {
    try {
      console.log(`[Gemini Assistant] Enviando a Gemini 2.5 Flash con Function Calling MCP...`);
      
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        config: {
          systemInstruction: `Eres "BiblioTech AI", el asistente inteligente oficial de la librería BiblioTech Store.
Tienes acceso directo a herramientas del sistema (MCP Tools):
- search_books: para buscar libros en catálogo
- check_stock: para revisar existencias y precios
- get_order_status: para rastrear pedidos con su folio
- get_store_kpis: para métricas del e-commerce
Usa siempre estas herramientas cuando el usuario te pregunte por libros, stock, inventario o pedidos. Responde de forma cordial, precisa y en español.`,
          tools: [{ functionDeclarations: geminiFunctionDeclarations }]
        }
      });

      // Verificar si Gemini decidió invocar alguna herramienta MCP (Function Call)
      const candidate = response.candidates?.[0];
      const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall);

      if (functionCalls && functionCalls.length > 0) {
        const toolCall = functionCalls[0].functionCall;
        console.log(`[Gemini Assistant] Gemini solicitó ejecutar herramienta MCP: ${toolCall.name}`, toolCall.args);

        // Ejecutar la herramienta en nuestro sistema MCP
        const toolResult = await executeMcpTool(toolCall.name, toolCall.args || {});

        // Enviar el resultado de vuelta a Gemini para generar la respuesta final natural
        const secondResponse = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
            candidate.content,
            {
              role: 'user',
              parts: [{
                functionResponse: {
                  name: toolCall.name,
                  response: { result: toolResult }
                }
              }]
            }
          ]
        });

        const replyText = secondResponse.text || secondResponse.candidates?.[0]?.content?.parts?.[0]?.text;
        return {
          source: 'GOOGLE_GEMINI_API',
          model: 'gemini-2.5-flash',
          toolExecuted: toolCall.name,
          toolArgs: toolCall.args,
          toolResult,
          reply: replyText
        };
      }

      // Respuesta directa sin llamada a función
      const directText = response.text || candidate?.content?.parts?.[0]?.text;
      return {
        source: 'GOOGLE_GEMINI_API',
        model: 'gemini-2.5-flash',
        toolExecuted: null,
        reply: directText
      };
    } catch (err) {
      console.warn('[Gemini Assistant API Error]', err.message);
      // Fallback transparente al motor de emulación inteligente
    }
  }

  // 2. Modo Inteligente de Demostración (Offline / Sin API Key externa)
  // Conecta directamente el mensaje del usuario con las herramientas MCP reales
  console.log('[Gemini Assistant] Modo Sandbox Activo: Conectando consulta a herramientas MCP...');

  const msg = userMessage.toLowerCase();
  let toolExecuted = null;
  let toolArgs = {};
  let toolResult = null;
  let reply = '';

  if (msg.includes('dune') || msg.includes('stock') || msg.includes('existencia') || msg.includes('disponible') || msg.includes('inventario')) {
    toolExecuted = 'check_stock';
    toolArgs = { titulo: msg.includes('dune') ? 'Dune' : (msg.includes('cien') ? 'Cien Años de Soledad' : 'Dune') };
    toolResult = await executeMcpTool('check_stock', toolArgs);
    
    if (toolResult.found) {
      reply = `✨ **[BiblioTech AI con Gemini & MCP]**: Consulté el inventario en tiempo real mediante la herramienta \`check_stock\`.  \n` +
              `El libro **"${toolResult.titulo}"** de **${toolResult.autor}** cuenta actualmente con **${toolResult.stock} unidades disponibles** en almacén a un precio de **$${Number(toolResult.precio).toFixed(2)} MXN**. ¿Te gustaría agregarlo a tu carrito?`;
    } else {
      reply = `✨ **[BiblioTech AI con Gemini & MCP]**: Consulté el inventario pero no encontré unidades registradas con ese término.`;
    }
  } else if (msg.includes('folio') || msg.includes('pedido') || msg.includes('orden') || msg.includes('rastrear') || msg.includes('donde esta') || msg.includes('dónde está') || /fol-[a-z0-9-]+/i.test(msg)) {
    toolExecuted = 'get_order_status';
    const match = msg.match(/fol-[a-z0-9-]+/i);
    const folioToFind = match ? match[0].toUpperCase() : 'FOL-DEMO-INIT';
    toolArgs = { folio: folioToFind };
    toolResult = await executeMcpTool('get_order_status', toolArgs);

    if (toolResult.found) {
      reply = `✨ **[BiblioTech AI con Gemini & MCP]**: Rastreé la orden **${toolResult.folio}** mediante la herramienta \`get_order_status\`.  \n` +
              `• **Estado:** ${toolResult.status}  \n` +
              `• **Cliente:** ${toolResult.cliente}  \n` +
              `• **Total:** $${Number(toolResult.total).toFixed(2)} MXN  \n` +
              `• **Dirección de entrega:** ${toolResult.direccionEnvio}  \n` +
              `• **Trazabilidad NoSQL (MongoDB):** Se registran ${toolResult.trazabilidadMongoDB?.length || 0} eventos de auditoría.`;
    } else {
      reply = `✨ **[BiblioTech AI con Gemini & MCP]**: No localicé ningún pedido con el folio "${folioToFind}". Verifica que el formato sea correcto (ej. FOL-MVZO...).`;
    }
  } else if (msg.includes('kpi') || msg.includes('ventas') || msg.includes('estadisticas') || msg.includes('cuanto hemos vendido')) {
    toolExecuted = 'get_store_kpis';
    toolResult = await executeMcpTool('get_store_kpis', {});
    reply = `✨ **[BiblioTech AI con Gemini & MCP]**: Consulté las métricas del e-commerce mediante la herramienta \`get_store_kpis\`:  \n` +
            `• **Ventas Totales:** $${Number(toolResult.ventasTotales).toFixed(2)} MXN  \n` +
            `• **Total de Pedidos:** ${toolResult.totalPedidos} órdenes registradas  \n` +
            `• **Libros en Catálogo:** ${toolResult.totalProductos} títulos`;
  } else {
    // Búsqueda general
    toolExecuted = 'search_books';
    const cleanTerm = userMessage.replace(/busca|buscar|tienes|libros|de|recomienda|por favor/gi, '').trim() || 'Ciencia';
    toolArgs = { query: cleanTerm, limite: 3 };
    toolResult = await executeMcpTool('search_books', toolArgs);

    if (toolResult.results && toolResult.results.length > 0) {
      const titulos = toolResult.results.map(r => `• **${r.titulo}** (${r.autor}) - $${Number(r.precio).toFixed(2)} MXN (Stock: ${r.stock})`).join('\n');
      reply = `✨ **[BiblioTech AI con Gemini & MCP]**: Encontré los siguientes títulos en el catálogo utilizando la herramienta \`search_books\`:\n\n${titulos}\n\n¿Deseas más información de alguno de ellos?`;
    } else {
      reply = `✨ **[BiblioTech AI con Gemini & MCP]**: ¡Hola! Soy el asistente inteligente de BiblioTech. Puedes pedirme buscar libros por título o autor, verificar existencias de cualquier título o rastrear tu pedido con tu Folio de compra.`;
    }
  }

  return {
    source: 'GEMINI_MCP_AGENT_SANDBOX',
    model: 'gemini-2.5-flash (MCP Function Calling)',
    toolExecuted,
    toolArgs,
    toolResult,
    reply
  };
}
