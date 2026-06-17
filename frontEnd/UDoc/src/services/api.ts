import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("udoc-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message: string =
        error.response?.data?.message ?? "";

      // O backend retorna 401 com essa mensagem APENAS quando o JWT está
      // ausente ou inválido (authenticationEntryPoint). Erros de permissão
      // vêm como 403. Ao detectar esse cenário, forçamos novo login para
      // que o usuário obtenha um token fresco e válido.
      if (message === "Token ausente ou inválido") {
        localStorage.removeItem("udoc-token");
        localStorage.removeItem("udoc-user");
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
