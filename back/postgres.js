import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL de conexión a PostgreSQL (ej. Supabase, Neon, Render o local)
const DATABASE_URL = process.env.DATABASE_URL || null;

let pool = null;
let isConnected = false;
let connectionError = null;

if (DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  } catch (err) {
    connectionError = err.message;
    console.warn('[PostgreSQL] Error al inicializar pool de conexiones:', err.message);
  }
}

/**
 * Inicializa y valida la conexión a PostgreSQL si DATABASE_URL está configurada.
 */
export async function initPostgres() {
  if (!DATABASE_URL || !pool) {
    console.log('[PostgreSQL] DATABASE_URL no configurada en .env. Driver oficial "pg" instalado y disponible. Operando en desarrollo con SQLite local.');
    return {
      active: false,
      driver: 'pg (node-postgres)',
      dbEngine: 'SQLite (Modo Desarrollo Dual)',
      message: 'Para activar PostgreSQL en la nube, define DATABASE_URL (Supabase/Neon) en back/.env'
    };
  }

  try {
    const client = await pool.connect();
    isConnected = true;
    connectionError = null;

    console.log('[PostgreSQL] Conectado exitosamente al cluster PostgreSQL.');

    // Crear tablas en PostgreSQL si no existen
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        icono VARCHAR(50),
        slug VARCHAR(100) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        autor VARCHAR(255) NOT NULL,
        isbn VARCHAR(50),
        editorial VARCHAR(100),
        precio NUMERIC(10, 2) NOT NULL,
        precioAnterior NUMERIC(10, 2),
        imagen TEXT,
        categoriaId INTEGER REFERENCES categorias(id),
        stock INTEGER NOT NULL DEFAULT 0,
        descripcion TEXT,
        paginas INTEGER DEFAULT 300,
        rating NUMERIC(3, 2) DEFAULT 4.8,
        resenasCount INTEGER DEFAULT 0,
        destacado BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'CLIENTE',
        telefono VARCHAR(50),
        direccion TEXT
      );

      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        folio VARCHAR(100) UNIQUE NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        subtotal NUMERIC(10, 2) NOT NULL,
        envio NUMERIC(10, 2) NOT NULL,
        total NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDIENTE',
        metodoPago VARCHAR(50) NOT NULL,
        direccionEnvio TEXT NOT NULL,
        nombreCliente VARCHAR(255) NOT NULL,
        emailCliente VARCHAR(255) NOT NULL,
        usuarioId INTEGER REFERENCES usuarios(id),
        detallesPago TEXT,
        referenciaPago VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS detalles_pedido (
        id SERIAL PRIMARY KEY,
        pedidoId INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
        productoId INTEGER REFERENCES productos(id),
        cantidad INTEGER NOT NULL,
        precioUnitario NUMERIC(10, 2) NOT NULL,
        subtotal NUMERIC(10, 2) NOT NULL
      );
    `);

    client.release();
    console.log('[PostgreSQL] Esquema relacional verificado y listo en PostgreSQL.');

    return {
      active: true,
      driver: 'pg (node-postgres)',
      dbEngine: 'PostgreSQL Relational DB',
      message: 'Conectado y sincronizado con PostgreSQL'
    };
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn('[PostgreSQL] No se pudo conectar al servidor PostgreSQL:', err.message);
    return {
      active: false,
      driver: 'pg (node-postgres)',
      dbEngine: 'SQLite (Fallback automático)',
      error: err.message
    };
  }
}

/**
 * Devuelve el estado actual de la integración PostgreSQL.
 */
export function getPostgresStatus() {
  return {
    driver: 'pg (node-postgres v8.x)',
    isConfigured: !!DATABASE_URL,
    isConnected,
    connectionError,
    engine: isConnected ? 'PostgreSQL (Cloud / Supabase / Neon)' : 'SQLite Dual Adapter (Desarrollo)'
  };
}

export { pool as pgPool };
