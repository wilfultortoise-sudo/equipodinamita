CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'CLIENTE'
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    imagen VARCHAR(500),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pedido_productos (
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    PRIMARY KEY (pedido_id, producto_id)
);

INSERT INTO categorias (nombre) VALUES
('Programación'), ('Literatura'), ('Educación')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@ecommerce.com', '123456', 'ADMIN'),
('Cliente Demo', 'cliente@ecommerce.com', '123456', 'CLIENTE')
ON CONFLICT (email) DO NOTHING;

INSERT INTO productos (nombre, precio, imagen, stock, categoria_id) VALUES
('Clean Code', 899.99, 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg', 8, (SELECT id FROM categorias WHERE nombre='Programación')),
('Python Crash Course', 1099.99, 'https://covers.openlibrary.org/b/isbn/9781718502703-L.jpg', 10, (SELECT id FROM categorias WHERE nombre='Programación')),
('El Principito', 349.99, 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg', 15, (SELECT id FROM categorias WHERE nombre='Literatura')),
('Don Quijote de la Mancha', 499.99, 'https://covers.openlibrary.org/b/isbn/9788420412146-L.jpg', 12, (SELECT id FROM categorias WHERE nombre='Literatura'))
ON CONFLICT DO NOTHING;
