//Este archivo no debe se saber nada sobre productos, categorias, etc.
//Nomas debe ser como "Dame una operación GraphQL y sus variables, yo la mando al backend."


const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000/';

const request = async (query, variables = {}) => {
  
const token =                //Con esta línea buscamos el auth_token
    typeof localStorage !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;  

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;  // si el auth_token es 'abc123', con esta línea lo convertimos a 'Authorization: Bearer abc123'
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });
// Esta línea es por si nos da error porque la sesión/token ya están vencidos. Si es así, borramos el token y mandamos pal login al usuario
 if (response.status === 401) {
  if (typeof localStorage !== 'undefined') {  //Esta linea de undefined es para que Astro no truene durante SSR 
    localStorage.removeItem('auth_token');
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }

  return;
}

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
        `API Error: ${response.status} - ${errorBody}`
    );
    }   

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);  //Con esta cosa vamos a capturar errores GraphQL porque HTTP no siempre responderá con 401. Pero ya después manejamos los errores más específicos amigos.
  }

  return result.data;
};

export const apiClient = {
  query: (query, variables = {}) =>
    request(query, variables),

  mutation: (mutation, variables = {}) =>
    request(mutation, variables),
};