import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { BASE_URL } from "./api";

const WS_URL = `${BASE_URL}/ws`;

let client: Client | null = null;
let statusHeartbeat: ReturnType<typeof setInterval> | null = null;

function getToken(): string {
  return localStorage.getItem("udoc-token") ?? "";
}

export function connectChat(
  onMensagem: (msg: any) => void,
  onBadge?: (data: { naoLidas: number }) => void,
  userId?: number,
  onStatus?: (data: { ismId: number; status: string }) => void,
  publishOnlineIsmId?: number
): () => void {
  const token = getToken();

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}`, token },
    reconnectDelay: 5000,
    onConnect: () => {
      // Mensagens pessoais (cliente ↔ ISM)
      client?.subscribe("/user/queue/mensagens", (frame) => {
        try { onMensagem(JSON.parse(frame.body)); } catch {}
      });

      // Badge de não lidas para ISM
      if (onBadge && userId) {
        client?.subscribe(`/topic/ism-badge-${userId}`, (frame) => {
          try { onBadge(JSON.parse(frame.body)); } catch {}
        });
      }

      // Cliente assina atualizações de status do ISM
      if (onStatus) {
        client?.subscribe("/topic/ism-status", (frame) => {
          try { onStatus(JSON.parse(frame.body)); } catch {}
        });
      }

      // ISM publica status Online ao conectar e mantém heartbeat a cada 15s
      if (publishOnlineIsmId) {
        publicarStatusIsm(publishOnlineIsmId, "Online");
        if (statusHeartbeat) clearInterval(statusHeartbeat);
        statusHeartbeat = setInterval(() => {
          publicarStatusIsm(publishOnlineIsmId, "Online");
        }, 15_000);
      }
    },
  });

  client.activate();

  // ISM publica Offline e limpa heartbeat antes de desconectar
  return () => {
    if (statusHeartbeat) { clearInterval(statusHeartbeat); statusHeartbeat = null; }
    if (publishOnlineIsmId) publicarStatusIsm(publishOnlineIsmId, "Offline");
    client?.deactivate();
    client = null;
  };
}

export function enviarMensagemIsm(payload: {
  conversaId: number;
  conteudo: string;
  ismEmail: string;
  ismUserId: number;
}) {
  client?.publish({ destination: "/app/chat.enviar", body: JSON.stringify(payload) });
}

export function responderComoIsm(payload: {
  conversaId: number;
  conteudo: string;
  clienteEmail: string;
}) {
  client?.publish({ destination: "/app/chat.responder", body: JSON.stringify(payload) });
}

export function publicarStatusIsm(ismId: number, status: "Online" | "Ausente" | "Offline") {
  client?.publish({ destination: "/app/chat.status", body: JSON.stringify({ ismId, status }) });
}

export function encerrarViaWs(payload: {
  conversaId: number;
  clienteEmail: string;
  ismUserId: number;
}) {
  client?.publish({ destination: "/app/chat.encerrar", body: JSON.stringify(payload) });
}

export function disconnectChat() {
  client?.deactivate();
  client = null;
}
