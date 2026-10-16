# Backend P2-6 — E-commerce GraphQL

## Stack
Python + FastAPI + Strawberry GraphQL + SQLAlchemy + PostgreSQL.

## Base de datos
1. Crear una base PostgreSQL llamada `ecommerce_db`.
2. Ejecutar `db.sql` sobre esa base.
3. En `app/database.py`, reemplazar `TU_PASSWORD` por la contraseña local de PostgreSQL o definir la variable `DATABASE_URL`.

Formato:
`postgresql+psycopg2://postgres:CONTRASENA@localhost:5432/ecommerce_db`

## Instalación
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Ejecución
```bash
uvicorn app.main:app --reload
```

GraphQL: `http://127.0.0.1:8000/graphql`
