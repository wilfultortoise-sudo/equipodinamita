import { apiClient } from './apiClient.js';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const authService = {
  getToken: () => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser: () => {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!authService.getToken();
  },

  setSession: (token, user) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-changed'));
    }
  },

  logout: () => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-changed'));
    }
  },

  login: async (email, password) => {
    const mutation = `
      mutation IniciarSesion($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          usuario {
            id
            nombre
            email
            rol
            telefono
            direccion
          }
        }
      }
    `;
    const data = await apiClient.mutation(mutation, { email, password });
    if (data?.login?.token) {
      authService.setSession(data.login.token, data.login.usuario);
      return data.login;
    }
    throw new Error('Respuesta de autenticación inválida.');
  },

  registro: async ({ nombre, email, password, telefono, direccion }) => {
    const mutation = `
      mutation RegistrarUsuario(
        $nombre: String!
        $email: String!
        $password: String!
        $telefono: String
        $direccion: String
      ) {
        registro(
          nombre: $nombre
          email: $email
          password: $password
          telefono: $telefono
          direccion: $direccion
        ) {
          token
          usuario {
            id
            nombre
            email
            rol
            telefono
            direccion
          }
        }
      }
    `;
    const data = await apiClient.mutation(mutation, {
      nombre,
      email,
      password,
      telefono,
      direccion
    });
    if (data?.registro?.token) {
      authService.setSession(data.registro.token, data.registro.usuario);
      return data.registro;
    }
    throw new Error('Error al registrar usuario.');
  },

  getMe: async () => {
    const query = `
      query ObtenerUsuarioActual {
        me {
          id
          nombre
          email
          rol
          telefono
          direccion
        }
      }
    `;
    try {
      const data = await apiClient.query(query);
      if (data?.me) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(data.me));
        }
        return data.me;
      }
      return null;
    } catch {
      return null;
    }
  }
};
