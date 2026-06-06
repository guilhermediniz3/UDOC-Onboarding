import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081",
});

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
      const token = localStorage.getItem("udoc-token");

      // Só desloga se o token realmente expirou ou não existe
      // Evita logout por erros pontuais de endpoints que retornam 401
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("udoc-token");
        localStorage.removeItem("udoc-user");
        window.location.reload();
      }
      // Se o token ainda é válido, apenas rejeita a promise sem deslogar
    }
    return Promise.reject(error);
  }
);

export default api;
