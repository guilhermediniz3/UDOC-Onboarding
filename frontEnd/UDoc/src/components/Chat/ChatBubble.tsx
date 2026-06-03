import { ActionIcon, Badge } from "@mantine/core";
import { IconMessageChatbot } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getChatConfig, getNaoLidasCliente, getNaoLidasIsm } from "../../services/chatApiService";
import ChatWindow from "./ChatWindow";

export default function ChatBubble() {
  const { user } = useAuth();
  const [open, setOpen]               = useState(false);
  const [globalOn, setGlobalOn]       = useState(false);
  const [ismOn, setIsmOn]             = useState(true);
  const [naoLidas, setNaoLidas]       = useState(0);
  const [loaded, setLoaded]           = useState(false);

  const isIsm     = user?.role === "ISM";
  const isExterno = user?.role === "FUNCIONARIO_EXTERNO";

  useEffect(() => {
    if (!user) return;
    getChatConfig()
      .then((cfg) => {
        setGlobalOn(cfg.chatGlobalHabilitado);
        setIsmOn(cfg.chatIsmHabilitado);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user]);

  // Badge de não lidas para ISM (mensagens do cliente)
  useEffect(() => {
    if (!isIsm) return;
    const atualizar = () => getNaoLidasIsm().then(setNaoLidas).catch(() => {});
    atualizar();
    const interval = setInterval(atualizar, 15_000);
    return () => clearInterval(interval);
  }, [isIsm]);

  // Badge de não lidas para cliente externo (respostas do ISM)
  useEffect(() => {
    if (!isExterno) return;
    const atualizar = () => getNaoLidasCliente().then(setNaoLidas).catch(() => {});
    atualizar();
    const interval = setInterval(atualizar, 15_000);
    return () => clearInterval(interval);
  }, [isExterno]);

  if (!loaded || !globalOn) return null;

  return (
    <>
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}>
        <div style={{ position: "relative" }}>
          <ActionIcon
            size={56}
            radius="50%"
            variant="gradient"
            gradient={{ from: "violet", to: "blue" }}
            onClick={() => setOpen((p) => !p)}
            style={{ boxShadow: "0 8px 24px rgba(124,58,237,0.5)" }}
          >
            <IconMessageChatbot size={28} />
          </ActionIcon>
          {naoLidas > 0 && (
            <Badge
              color="red"
              size="md"
              radius="xl"
              style={{
                position: "absolute", top: -4, right: -4,
                minWidth: 20, height: 20, padding: "0 5px",
                pointerEvents: "none",
              }}
            >
              {naoLidas > 99 ? "99+" : naoLidas}
            </Badge>
          )}
        </div>
      </div>

      {open && (
        <ChatWindow
          onClose={() => setOpen(false)}
          chatIsmHabilitado={ismOn}
        />
      )}
    </>
  );
}
