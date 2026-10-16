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

// 1. Inicializar la base de datos relacional SQLite
initDB();

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

// Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Apollo Server 4 + graphql-ws',
    endpoints: ['/graphql', '/'],
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
