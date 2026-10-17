// Cliente HTTP nativo para consultar el endpoint GraphQL (/graphql)
// Soporta Backend Node.js (puerto 4000) o Backend Python FastAPI (puerto 8000/graphql)
export const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/';

export async function fetchGraphQL(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors.map(e => e.message).join(', ');
      throw new Error(errorMessage || 'Error en la respuesta GraphQL');
    }

    return result.data;
  } catch (error) {
    console.error('[GraphQL Client Error]:', error);
    throw error;
  }
}

// Queries Predefinidas
export const QUERIES = {
  GET_HOME_DATA: `
    query GetHomeData {
      categorias {
        id
        nombre
        descripcion
        icono
        slug
      }
      productos {
        id
        titulo
        autor
        isbn
        editorial
        precio
        precioAnterior
        imagen
        categoriaId
        stock
        descripcion
        paginas
        rating
        resenasCount
        destacado
        categoria {
          id
          nombre
        }
      }
    }
  `,

  GET_PRODUCTOS: `
    query GetProductos($categoriaId: ID, $busqueda: String) {
      productos(categoriaId: $categoriaId, busqueda: $busqueda) {
        id
        titulo
        autor
        isbn
        editorial
        precio
        precioAnterior
        imagen
        categoriaId
        stock
        descripcion
        paginas
        rating
        resenasCount
        destacado
        categoria {
          id
          nombre
        }
      }
    }
  `,

  GET_PRODUCTO_DETAIL: `
    query GetProductoDetail($id: ID!) {
      producto(id: $id) {
        id
        titulo
        autor
        isbn
        editorial
        precio
        precioAnterior
        imagen
        categoriaId
        stock
        descripcion
        paginas
        rating
        resenasCount
        destacado
        categoria {
          id
          nombre
          descripcion
        }
      }
    }
  `
};

// Mutations Predefinidas
export const MUTATIONS = {
  CREAR_PEDIDO: `
    mutation CrearPedido($datos: PedidoInput!) {
      crearPedido(datos: $datos) {
        id
        folio
        fecha
        subtotal
        envio
        total
        status
        metodoPago
        direccionEnvio
        nombreCliente
        emailCliente
        detalles {
          id
          cantidad
          precioUnitario
          subtotal
          producto {
            id
            titulo
            imagen
            autor
          }
        }
      }
    }
  `
};
