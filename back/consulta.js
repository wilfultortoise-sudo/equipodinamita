import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('./ecommerce.db');

const usuarios = db.prepare(`
  SELECT id, nombre, email, rol
  FROM usuarios
`).all();

console.table(usuarios);

db.close();s