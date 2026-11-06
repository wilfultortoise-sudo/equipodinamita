-- ============================================================
-- BIBLIOTECH STORE - ESQUEMA RELACIONAL POSTGRESQL (PRODUCCIÓN)
-- Compatible con Supabase, Neon, Render, Railway y PostgreSQL local
-- ============================================================

-- 1. TABLA: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(50),
  slug VARCHAR(100) UNIQUE NOT NULL
);

-- 2. TABLA: productos
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

-- 3. TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'CLIENTE',
  telefono VARCHAR(50),
  direccion TEXT
);

-- 4. TABLA: pedidos
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

-- 5. TABLA: detalles_pedido
CREATE TABLE IF NOT EXISTS detalles_pedido (
  id SERIAL PRIMARY KEY,
  pedidoId INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  productoId INTEGER REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precioUnitario NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

-- ============================================================
-- DATOS INICIALES (SEED DATA)
-- ============================================================

INSERT INTO categorias (nombre, descripcion, icono, slug) VALUES
('Ciencia Ficción', 'Universos lejanos, futuros distópicos y viajes en el tiempo.', '🚀', 'ciencia-ficcion'),
('Fantasía', 'Mundos mágicos, criaturas legendarias y épicas aventuras.', '🐉', 'fantasia'),
('Terror', 'Historias de suspenso, horror cósmico y escalofríos.', '👻', 'terror'),
('Desarrollo Web', 'Programación moderna, frontend, backend y arquitectura de software.', '💻', 'desarrollo-web')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO usuarios (nombre, email, password, rol, telefono, direccion) VALUES
('Hector Emiliano Reyes Gonzalez', 'a23100134@ceti.mx', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'ADMIN', '3312345678', 'Av. del Parque 1234, Guadalajara, Jalisco'),
('Administrador del Sistema', 'admin@bibliotech.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'ADMIN', '3300000000', 'BiblioTech HQ')
ON CONFLICT (email) DO NOTHING;
