import axios from "axios";
import { notifications } from "@mantine/notifications";

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
    const status = error.response?.status;

    if (status === 401) {
      const message: string =
        error.response?.data?.message ?? "";

      if (message === "Token ausente ou inválido") {
        localStorage.removeItem("udoc-token");
        localStorage.removeItem("udoc-user");
        window.location.reload();
      }
    }

    if (status === 403) {
      const friendlyMessage =
        "Você não tem permissão para realizar esta ação.";

      // Reescreve a mensagem no objeto de erro para que catch blocks
      // que leem error.response.data.message exibam texto amigável
      if (error.response?.data) {
        error.response.data.message = friendlyMessage;
      }

      // Notificação global — aparece em qualquer tela, mesmo que o
      // componente não trate o erro individualmente
      notifications.show({
        title: "Sem permissão",
        message: friendlyMessage,
        color: "orange",
        autoClose: 5000,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
