# BiblioTech Store — E-Commerce Full-Stack de Libros (Entrega Final: Pasos 1 al 6)

Plataforma full-stack de comercio electrónico especializada en libros, construida con **Astro 5 + React 18 (Arquitectura de Islas con Zustand)** en el frontend y **Node.js + Apollo Server 4 (GraphQL HTTP + Suscripciones WebSocket `graphql-ws`)** en el backend, equipada con **Persistencia Híbrida Dual (PostgreSQL/SQLite + MongoDB Atlas/JSON)**, **5 APIs de Terceros**, **Pipeline CI/CD en GitHub Actions** y **Asistente Inteligente con Google Gemini y Model Context Protocol (MCP)**.

---

## Información Académica del Proyecto

- **Institución:** Centro de Enseñanza Técnica Industrial (CETI — Plantel Colomos)
- **Materia:** Programación Web II
- **Docente:** Ing. Octavio Villavicencio Cruz
- **Equipo de Desarrollo (Equipo Dinamita):**
  - Reyes González Héctor Emiliano (Registro: `23100134`)
  - Covarrubias Alvarez Hugo Emmanuel (Registro: `23100080`)
  - Pérez Velázquez Rafael (Registro: `22100165`)
  - Yáñez Rodríguez Alan Omar (Registro: `22300896`)

> 📄 **Documentación Formal de Entrega (Paso 5 — FODA, Matriz SFW, Sitemap y Diagramas de Flujo del Checkout):**  
> Consulta el documento completo en [`DOCUMENTACION_FODA_SFW_ARQUITECTURA.md`](./DOCUMENTACION_FODA_SFW_ARQUITECTURA.md).

---

## Resumen de Pasos Implementados (1 al 6)

| Paso | Módulo / Requerimiento | Implementación en el Proyecto |
| :---: | :--- | :--- |
| **Paso 1** | **Pipeline CI/CD** | `.github/workflows/ci-cd.yml` con validación de sintaxis, healthcheck del backend híbrido HTTP/WS, pruebas automatizadas (`test_subscriptions.js`), build de producción Astro/React y despliegue continuo a Netlify (`netlify.toml`). |
| **Paso 2** | **5 APIs de Terceros** | 1. **Mercado Pago Checkout API** (`back/mercadopago.js`, 17 escenarios + Webhook)<br>2. **PayPal Express SDK** (`front/src/components/islands/PaymentGateway.jsx`)<br>3. **Leaflet + OpenStreetMap Nominatim API** (`front/src/components/islands/CheckoutForm.jsx`)<br>4. **Nodemailer SMTP Transaccional** (`back/mailer.js`)<br>5. **Google Books API + Open Library API** (`front/src/pages/admin/productos.astro`) |
| **Paso 3** | **Bases de Datos Duales (SQL + NoSQL)** | • **Relacional:** PostgreSQL (`back/postgres.js`, `back/db_postgres.sql`) con *fallback* automático a SQLite local (`back/db.js`, `back/ecommerce.db`).<br>• **NoSQL:** MongoDB Atlas (`back/mongodb.js`) con colecciones `resenas` y `auditoria_pedidos` y *fallback* persistente en `back/data/`. |
| **Paso 4** | **Servidor MCP + Asistente IA Gemini** | • **Servidor MCP Oficial:** `back/mcp_server.js` (Stdio) y endpoints HTTP (`/mcp`, `/mcp/tools`, `/mcp/call`) con 4 herramientas (`search_books`, `check_stock`, `get_order_status`, `get_store_kpis`).<br>• **Asistente Flotante Gemini:** `back/gemini_assistant.js` + `front/src/components/GeminiAssistantModal.astro`. |
| **Paso 5** | **Documentación FODA, SFW y Diagramas** | Documento formal [`DOCUMENTACION_FODA_SFW_ARQUITECTURA.md`](./DOCUMENTACION_FODA_SFW_ARQUITECTURA.md) con Análisis FODA (SWOT), Matriz SFW de Alcance Funcional, Sitemap de rutas y Diagramas Mermaid del Checkout. |
| **Paso 6** | **GitHub & Configuración de Despliegue** | Configuración declarativa en `netlify.toml` (`front/` -> `front/dist`) y scripts de producción para Render/Railway. |

---

## Arquitectura del Repositorio

```text
equipodinamita/
├── .github/workflows/
│   └── ci-cd.yml                              # Paso 1: Pipeline CI/CD (Tests + Build + Deploy Netlify)
├── DOCUMENTACION_FODA_SFW_ARQUITECTURA.md     # Paso 5: Análisis FODA, Matriz SFW, Sitemap y Flujos
├── netlify.toml                               # Paso 6: Configuración de despliegue en Netlify
├── mcp_config.json                            # Paso 4: Configuración MCP para Claude Desktop / Cursor
├── package.json                               # Scripts globales de orquestación
├── back/                                      # BACKEND: Node.js + Apollo Server 4 + Express + WS (Puerto 4000)
│   ├── index.js                               # Servidor híbrido GraphQL (/graphql), WS, Webhook MP, MCP y Gemini
│   ├── schema.js                              # Esquema GraphQL (Queries, Mutations, Subscriptions)
│   ├── resolvers.js                           # Resolvers conectados a SQL, MongoDB, Mercado Pago y Nodemailer
│   ├── db.js                                  # Adaptador relacional SQLite (ecommerce.db) y JWT
│   ├── postgres.js                            # Adaptador relacional PostgreSQL (Pool pg)
│   ├── mongodb.js                             # Adaptador NoSQL MongoDB Atlas (resenas y auditoria_pedidos)
│   ├── mercadopago.js                         # API 1: Motor Mercado Pago Checkout API (17 escenarios)
│   ├── mailer.js                              # API 4: Servicio de correos HTML con Nodemailer
│   ├── mcp_tools.js                           # Definición y ejecución de las 4 herramientas MCP
│   ├── mcp_server.js                          # Servidor MCP sobre transporte Stdio
│   ├── gemini_assistant.js                    # Agente Google Gemini 2.5 Flash con Function Calling MCP
│   └── .env.example                           # Plantilla de variables de entorno
└── front/                                     # FRONTEND: Astro 5 + React 18 Islands + Zustand (Puerto 4321)
    └── src/
        ├── layouts/
        │   ├── BaseLayout.astro               # Layout general + Asistente Flotante Gemini IA
        │   └── AdminLayout.astro              # Layout protegido con Guard JWT para rol ADMIN
        ├── components/
        │   ├── GeminiAssistantModal.astro     # Widget conversacional conectado a /api/chat-gemini y MCP
        │   └── islands/
        │       ├── CheckoutForm.jsx           # API 3: Mapa interactivo Leaflet + OpenStreetMap
        │       ├── PaymentGateway.jsx         # API 1 y 2: Mercado Pago, PayPal Express, SPEI y OXXO
        │       ├── CartItems.jsx              # Carrito reactivo con Zustand
        │       └── AddToCart.jsx              # Hidratación parcial para agregar libros al carrito
        └── pages/
            ├── index.astro                    # Inicio y libros destacados
            ├── catalogo.astro                 # Catálogo con filtros dinámicos
            ├── producto/[id].astro            # Detalle del libro + Reseñas NoSQL en MongoDB
            ├── carrito.astro                  # Vista del carrito de compras
            ├── checkout.astro                 # Checkout unificado con mapa y pasarelas
            ├── orden-confirmada.astro         # Recibo oficial de compra
            ├── ordenes.astro                  # Historial de pedidos del cliente en tiempo real
            └── admin/
                ├── index.astro                # Dashboard de KPIs y estado de bases de datos
                ├── productos.astro            # CRUD de inventario + API 5: Google Books por ISBN
                └── ordenes.astro              # Gestión de órdenes WebSocket + Auditoría MongoDB
```

---

## Instrucciones de Instalación y Ejecución Local

### 1. Instalar dependencias
```bash
cd back
npm install
cd ../front
npm install
```

### 2. Variables de entorno (`back/.env`)
Si no existe `back/.env`, puedes copiar `back/.env.example`:
```bash
cp back/.env.example back/.env
```
> **Nota:** Todas las conexiones remotas (`DATABASE_URL`, `MONGODB_URI`, `GEMINI_API_KEY`, `SMTP_HOST`) son opcionales en desarrollo; si no se configuran, el backend activa automáticamente sus motores locales (**SQLite**, **JSON NoSQL persistente** y **Sandbox MCP/Email**) sin errores.

### 3. Iniciar entorno de desarrollo (2 terminales)
* **Terminal 1 (Backend — Puerto 4000):**
  ```bash
  cd back
  npm run dev
  ```
  - GraphQL Endpoint: `http://localhost:4000/graphql`
  - Healthcheck & Estado Dual BD/MCP: `http://localhost:4000/health`

* **Terminal 2 (Frontend — Puerto 4321):**
  ```bash
  cd front
  npm run dev
  ```
  - Tienda Web: `http://localhost:4321`
  - Panel Admin: `http://localhost:4321/admin`
