import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const localResenasPath = path.join(dataDir, 'mongodb_resenas.json');
const localAuditoriaPath = path.join(dataDir, 'mongodb_auditoria.json');

// Semillas iniciales para la colección de Reseñas en MongoDB
const INITIAL_RESENAS = [
  {
    id: 'res-dune-01',
    productoId: '1',
    usuarioNombre: 'Hugo E.',
    calificacion: 5,
    comentario: 'Una obra maestra imprescindible de la ciencia ficción. La edición física de BiblioTech llegó impecable.',
    fecha: '2026-10-15T14:32:00.000Z',
    verificado: true
  },
  {
    id: 'res-dune-02',
    productoId: '1',
    usuarioNombre: 'Valeria R.',
    calificacion: 5,
    comentario: 'Excelente construcción de mundo y desarrollo político en Arrakis. Lo leí en menos de una semana.',
    fecha: '2026-10-18T19:10:00.000Z',
    verificado: true
  },
  {
    id: 'res-sol-01',
    productoId: '2',
    usuarioNombre: 'Carlos M.',
    calificacion: 5,
    comentario: 'El realismo mágico en su máxima expresión. Macondo y la familia Buendía quedan grabados en la memoria.',
    fecha: '2026-10-20T11:45:00.000Z',
    verificado: true
  },
  {
    id: 'res-astro-01',
    productoId: '3',
    usuarioNombre: 'Estudiante CETI',
    calificacion: 5,
    comentario: 'La guía definitiva para construir sitios ultrarrápidos con Astro y React. Recomendadísimo para la materia.',
    fecha: '2026-10-25T16:20:00.000Z',
    verificado: true
  }
];

// Semillas iniciales para la colección de Auditoría de Pedidos en MongoDB
const INITIAL_AUDITORIA = [
  {
    id: 'audit-001',
    pedidoFolio: 'FOL-DEMO-INIT',
    evento: 'SISTEMA_INICIALIZADO',
    metodoPago: 'SISTEMA',
    total: 0.0,
    detalles: 'Base de datos NoSQL MongoDB conectada y colecciones listas (resenas & auditoria_pedidos).',
    fecha: new Date().toISOString()
  }
];

// Helper para leer/escribir almacenamiento local persistente
function loadLocal(filePath, defaultData) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {}
  fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  return defaultData;
}

function saveLocal(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[MongoDB Local Store] Error al guardar datos:', e.message);
  }
}

// Variables de estado de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || null;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'bibliotech_nosql';

let mongoClient = null;
let mongoDb = null;
let isConnected = false;
let connectionMode = 'LOCAL_PERSISTENT'; // 'ATLAS_CLOUD' o 'LOCAL_PERSISTENT'

// Inicializar conexión a MongoDB
export async function initMongoDB() {
  if (MONGODB_URI) {
    try {
      console.log('[MongoDB NoSQL] Conectando a cluster MongoDB Atlas...');
      mongoClient = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      await mongoClient.connect();
      mongoDb = mongoClient.db(MONGODB_DB_NAME);
      isConnected = true;
      connectionMode = 'ATLAS_CLOUD';
      console.log(`[MongoDB NoSQL] Conectado exitosamente a MongoDB Atlas (BD: ${MONGODB_DB_NAME}).`);

      // Asegurar índices en las colecciones de MongoDB
      const resenasCol = mongoDb.collection('resenas');
      const auditoriaCol = mongoDb.collection('auditoria_pedidos');
      await resenasCol.createIndex({ productoId: 1 });
      await auditoriaCol.createIndex({ pedidoFolio: 1 });

      // Si está vacía, sembrar reseñas iniciales
      const count = await resenasCol.countDocuments();
      if (count === 0) {
        await resenasCol.insertMany(INITIAL_RESENAS);
        console.log('[MongoDB NoSQL] Semillas de reseñas insertadas en MongoDB Atlas.');
      }

      return {
        active: true,
        mode: connectionMode,
        database: MONGODB_DB_NAME,
        driver: 'mongodb (Oficial NodeJS v6.x)',
        message: 'Conectado a MongoDB Atlas Cloud'
      };
    } catch (err) {
      console.warn('[MongoDB NoSQL] Advertencia al conectar a MongoDB Atlas:', err.message);
      console.log('[MongoDB NoSQL] Activando motor NoSQL local persistente (Modo Dual de Respaldo).');
      connectionMode = 'LOCAL_PERSISTENT';
      isConnected = false;
    }
  } else {
    console.log('[MongoDB NoSQL] MONGODB_URI no provista en .env. Motor NoSQL activo con persistencia local.');
    connectionMode = 'LOCAL_PERSISTENT';
  }

  // Inicializar almacenamiento local persistente
  loadLocal(localResenasPath, INITIAL_RESENAS);
  loadLocal(localAuditoriaPath, INITIAL_AUDITORIA);

  return {
    active: true,
    mode: connectionMode,
    database: 'bibliotech_nosql (Local Persistent Storage)',
    driver: 'mongodb (Oficial NodeJS v6.x)',
    message: 'Listo para conectar a MongoDB Atlas mediante variable MONGODB_URI'
  };
}

// ============================================================
// COLECCIÓN 1: RESEÑAS Y CALIFICACIONES DE LIBROS (resenas)
// ============================================================
export const mongoReviews = {
  getByProduct: async (productoId) => {
    if (isConnected && mongoDb) {
      try {
        const docs = await mongoDb.collection('resenas')
          .find({ productoId: String(productoId) })
          .sort({ fecha: -1 })
          .toArray();
        return docs.map(d => ({ ...d, id: d._id ? String(d._id) : d.id }));
      } catch (err) {
        console.warn('[MongoDB] Error al consultar reseñas:', err.message);
      }
    }

    // Fallback local
    const list = loadLocal(localResenasPath, INITIAL_RESENAS);
    return list
      .filter(r => String(r.productoId) === String(productoId))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  create: async ({ productoId, usuarioNombre, calificacion, comentario, verificado = true }) => {
    const nuevaResena = {
      id: `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      productoId: String(productoId),
      usuarioNombre: usuarioNombre.trim(),
      calificacion: Math.min(5, Math.max(1, parseInt(calificacion, 10) || 5)),
      comentario: comentario.trim(),
      fecha: new Date().toISOString(),
      verificado: !!verificado
    };

    if (isConnected && mongoDb) {
      try {
        const res = await mongoDb.collection('resenas').insertOne(nuevaResena);
        return { ...nuevaResena, id: String(res.insertedId || nuevaResena.id) };
      } catch (err) {
        console.warn('[MongoDB] Error al guardar reseña en Atlas:', err.message);
      }
    }

    // Guardado local
    const list = loadLocal(localResenasPath, INITIAL_RESENAS);
    list.unshift(nuevaResena);
    saveLocal(localResenasPath, list);
    return nuevaResena;
  }
};

// ============================================================
// COLECCIÓN 2: AUDITORÍA DE PEDIDOS (auditoria_pedidos)
// ============================================================
export const mongoAudit = {
  logEvent: async ({ pedidoFolio, evento, metodoPago, total, detalles, metadata = {} }) => {
    const registro = {
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      pedidoFolio: String(pedidoFolio),
      evento: String(evento).toUpperCase(),
      metodoPago: metodoPago || 'N/A',
      total: Number(total || 0),
      detalles: String(detalles || ''),
      metadata: metadata || {},
      fecha: new Date().toISOString()
    };

    console.log(`[MongoDB NoSQL: auditoria_pedidos] ${registro.evento} -> Folio: ${registro.pedidoFolio}`);

    if (isConnected && mongoDb) {
      try {
        const res = await mongoDb.collection('auditoria_pedidos').insertOne(registro);
        return { ...registro, id: String(res.insertedId || registro.id) };
      } catch (err) {
        console.warn('[MongoDB] Error al guardar auditoría en Atlas:', err.message);
      }
    }

    // Guardado local
    const list = loadLocal(localAuditoriaPath, INITIAL_AUDITORIA);
    list.unshift(registro);
    saveLocal(localAuditoriaPath, list);
    return registro;
  },

  getByFolio: async (pedidoFolio) => {
    if (isConnected && mongoDb) {
      try {
        const docs = await mongoDb.collection('auditoria_pedidos')
          .find({ pedidoFolio: String(pedidoFolio) })
          .sort({ fecha: -1 })
          .toArray();
        return docs.map(d => ({ ...d, id: d._id ? String(d._id) : d.id }));
      } catch (err) {
        console.warn('[MongoDB] Error al consultar auditoría:', err.message);
      }
    }

    const list = loadLocal(localAuditoriaPath, INITIAL_AUDITORIA);
    return list
      .filter(a => String(a.pedidoFolio) === String(pedidoFolio))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  getAll: async (limite = 50) => {
    if (isConnected && mongoDb) {
      try {
        const docs = await mongoDb.collection('auditoria_pedidos')
          .find({})
          .sort({ fecha: -1 })
          .limit(limite)
          .toArray();
        return docs.map(d => ({ ...d, id: d._id ? String(d._id) : d.id }));
      } catch (err) {
        console.warn('[MongoDB] Error al consultar todas las auditorías:', err.message);
      }
    }

    const list = loadLocal(localAuditoriaPath, INITIAL_AUDITORIA);
    return list.slice(0, limite);
  }
};

export function getMongoStatus() {
  return {
    driver: 'mongodb (MongoDB Node.js Driver v6.x)',
    isConfigured: !!MONGODB_URI,
    isConnected,
    mode: connectionMode,
    database: MONGODB_DB_NAME,
    collections: ['resenas', 'auditoria_pedidos']
  };
}
