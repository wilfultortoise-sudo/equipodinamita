import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { initDB, dbRepo, verifyToken } from './db.js';

// Inicializar la base de datos relacional
initDB();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    console.error('[GraphQL Error]', formattedError.message);
    return formattedError;
  }
});

const PORT = Number(process.env.PORT) || 4000;

const { url } = await startStandaloneServer(server, {
  listen: { port: PORT },
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

console.log(`
===========================================================
   SERVIDOR GRAPHQL INICIADO CON EXITO
   Endpoint GraphQL: ${url}
   E-commerce: BiblioTech Store (E-Commerce de Libros)
   Equipo de Desarrollo:
     - Reyes Gonzalez Hector Emiliano (23100134)
     - Covarrubias Alvarez Hugo Emmanuel (23100080)
     - Yañez Rodríguez Alan Omar (22300896)
     - Perez Velazquez Rafael (22100161)

   Profesor: Villavicencio Cruz Octavio
   Proyecto: E-Commerce Integrado (React + Zustand + GraphQL + SQLite)
===========================================================
`);
