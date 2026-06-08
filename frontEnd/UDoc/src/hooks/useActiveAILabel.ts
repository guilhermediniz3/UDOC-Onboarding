import { useEffect, useState } from "react";
import { getActiveAIProviderName } from "../services/userService";

/**
 * Retorna o displayName do provedor de IA efetivo para o usuário logado
 * (resolve a cascata usuário→empresa→global→default no backend).
 * Fallback: "IA" enquanto carrega ou em caso de erro.
 */
export function useActiveAILabel(): string {
  const [label, setLabel] = useState("IA");

  useEffect(() => {
    getActiveAIProviderName()
      .then(setLabel)
      .catch(() => {});
  }, []);

  return label;
}
