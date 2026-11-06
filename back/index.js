import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';

import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { initDB, dbRepo, verifyToken } from './db.js';
import { initPostgres, getPostgresStatus } from './postgres.js';
import { initMongoDB, getMongoStatus } from './mongodb.js';
import { MCP_TOOLS_DEFINITIONS, executeMcpTool } from './mcp_tools.js';
import { chatWithGemini } from './gemini_assistant.js';

// 1. Inicializar la base de datos relacional SQLite
initDB();
await initPostgres();
await initMongoDB();

// 2. Unificar schema ejecutable con makeExecutableSchema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// 3. Crear app de Express y servidor HTTP nativo
const app = express();
const httpServer = http.createServer(app);

// 4. Configurar WebSocketServer dedicado para suscripciones en /graphql
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql'
});

// 5. Configurar graphql-ws useServer para gestionar el ciclo de vida de las suscripciones
const serverCleanup = useServer(
  {
    schema,
    context: async (ctx, msg, args) => {
      // Extraer token desde connectionParams (ej: { authorization: 'Bearer ...' })
      const rawToken =
        ctx.connectionParams?.authorization ||
        ctx.connectionParams?.Authorization ||
        ctx.connectionParams?.token ||
        '';

      let currentUser = null;
      if (rawToken) {
        const decoded = verifyToken(rawToken);
        if (decoded && decoded.id) {
          currentUser = dbRepo.getUsuarioById(decoded.id);
        }
      }

      return {
        token: rawToken,
        currentUser
      };
    },
    onConnect: async (ctx) => {
      const rawToken =
        ctx.connectionParams?.authorization ||
        ctx.connectionParams?.Authorization ||
        ctx.connectionParams?.token ||
        '';

      if (rawToken) {
        const decoded = verifyToken(rawToken);
        console.log(
          `[WebSocket] Conexión establecida con usuario autenticado (ID: ${decoded?.id || 'Desconocido'}, Rol: ${decoded?.rol || 'N/A'})`
        );
      } else {
        console.log('[WebSocket] Conexión establecida (Cliente anónimo / público)');
      }
    },
    onDisconnect: () => {
      console.log('[WebSocket] Conexión cerrada');
    }
  },
  wsServer
);

// 6. Configurar Apollo Server con plugins de drenado seguro (HTTP + WS)
const server = new ApolloServer({
  schema,
  plugins: [
    // Drenado apropiado del servidor HTTP
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // Drenado apropiado del servidor WebSocket al apagar
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          }
        };
      }
    }
  ],
  formatError: (formattedError, error) => {
    console.error('[GraphQL Error]', formattedError.message);
    return formattedError;
  }
});

// 7. Iniciar el servidor Apollo
await server.start();

// 8. Configurar middlewares globales de Express (CORS y JSON)
app.use(
  cors({
    origin: '*',
    credentials: true
  })
);

app.use(express.json());

const apolloMiddleware = expressMiddleware(server, {
  context: async ({ req }) => {
    const rawHeader = req.headers.authorization || '';
    let currentUser = null;
    if (rawHeader) {
      const decoded = verifyToken(rawHeader);
      if (decoded && decoded.id) {
        currentUser = dbRepo.getUsuarioById(decoded.id);
      }
    }
    return {
      token: rawHeader,
      currentUser
    };
  }
});

// Soporte dual: /graphql (estándar GraphQL) y / (compatibilidad con frontend existente)
app.use('/graphql', apolloMiddleware);
app.post('/', apolloMiddleware);

// Webhook oficial de Mercado Pago (IPN / Webhooks)
app.post('/webhook/mercadopago', async (req, res) => {
  try {
    const payload = req.body || {};
    const query = req.query || {};
    const paymentId = payload?.data?.id || query?.id || query?.['data.id'];
    const action = payload?.action || query?.topic || query?.type || 'payment';

    console.log(`[Mercado Pago Webhook] Evento recibido: ${action} | Payment ID: ${paymentId || 'N/A'}`);

    // Si el webhook reporta un pago actualizado, podemos sincronizar el pedido
    if (paymentId && (action.includes('payment') || action === 'payment.updated')) {
      // Buscar pedido por referencia de Mercado Pago si existe
      try {
        const orderRow = dbRepo.getPedidos().find(p => p.referenciaPago && p.referenciaPago.includes(paymentId));
        if (orderRow) {
          console.log(`[Mercado Pago Webhook] Sincronizando orden ${orderRow.folio} con estado confirmado por Webhook.`);
        }
      } catch (syncErr) {
        console.warn('[Mercado Pago Webhook Sync]', syncErr.message);
      }
    }

    // Mercado Pago requiere una respuesta 200 o 201 inmediata para confirmar la recepción
    return res.status(200).json({ received: true, action, paymentId });
  } catch (err) {
    console.error('[Mercado Pago Webhook Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ENDPOINTS MCP (Model Context Protocol - Paso 4)
// ============================================================
app.get('/mcp', (req, res) => {
  res.json({
    name: 'bibliotech-ecommerce-mcp',
    version: '1.0.0',
    description: 'Servidor MCP oficial de BiblioTech Store para asistentes de IA (Claude, Cursor, etc.).',
    status: 'ACTIVE',
    protocol: 'Model Context Protocol (v2024-11-05 / SDK v1.x)',
    transport: {
      stdio: 'node back/mcp_server.js',
      http: {
        toolsList: 'GET http://localhost:4000/mcp/tools',
        toolsCall: 'POST http://localhost:4000/mcp/call'
      }
    },
    toolsAvailable: MCP_TOOLS_DEFINITIONS.map(t => t.name)
  });
});

app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: MCP_TOOLS_DEFINITIONS
  });
});

app.post('/mcp/call', async (req, res) => {
  try {
    const { tool, args } = req.body || {};
    if (!tool) {
      return res.status(400).json({ error: 'Debes especificar el nombre de la herramienta en el campo "tool".' });
    }

    const result = await executeMcpTool(tool, args || {});
    return res.json({ tool, success: true, result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint del Asistente Gemini conectado a MCP
app.post('/api/chat-gemini', async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'El campo "message" es obligatorio.' });
    }

    const response = await chatWithGemini(message, history || []);
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    databases: {
      relational: getPostgresStatus(),
      nosql: getMongoStatus()
    },
    server: 'Apollo Server 4 + graphql-ws',
    endpoints: ['/graphql', '/', '/webhook/mercadopago', '/mcp', '/mcp/tools', '/mcp/call'],
    mcp: {
      status: 'active',
      tools: MCP_TOOLS_DEFINITIONS.map(t => t.name)
    },
    subscriptions: ['pedidoCreado', 'pedidoActualizado', 'stockActualizado']
  });
});

const PORT = Number(process.env.PORT) || 4000;

// 9. Iniciar el servidor HTTP híbrido (HTTP + WebSockets en el mismo puerto)
httpServer.listen(PORT, () => {
  console.log(`
===========================================================
   SERVIDOR GRAPHQL CON SUSCRIPCIONES INICIADO CON EXITO
   Endpoint HTTP:      http://localhost:${PORT}/graphql
   Endpoint WebSocket: ws://localhost:${PORT}/graphql
   Health Check:       http://localhost:${PORT}/health
   E-commerce:         BiblioTech Store (Fase 1: BackOffice Subscriptions)
   Suscripciones GQL:  pedidoCreado, pedidoActualizado, stockActualizado
   Tecnologías:        Node.js + Apollo Server 4 + Express + ws + graphql-ws
===========================================================
`);
});
