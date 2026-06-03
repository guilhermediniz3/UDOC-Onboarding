import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import type { MyPermissions } from "../services/permissionService";
import { getMyPermissions } from "../services/permissionService";

interface PermissionContextType {
  permissions: MyPermissions;
  /** ADMIN tem mapa vazio — interpreta como tudo concedido */
  can: (module: string, action: string) => boolean;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: {},
  can: () => true,
  loading: false,
});

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<MyPermissions>({});
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) { setPermissions({}); return; }

    // ADMIN: não precisa buscar permissões, tem tudo
    if (user.role === "ADMIN") { setPermissions({}); return; }

    setLoading(true);
    getMyPermissions()
      .then(setPermissions)
      .catch(() => setPermissions({}))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.id]);

  function can(module: string, action: string): boolean {
    if (!user || user.role === "ADMIN") return true;
    // Mapa vazio → backend não retornou permissões → assume concedido
    if (Object.keys(permissions).length === 0) return true;
    const mod = permissions[module];
    if (!mod) return true; // módulo não mapeado → concedido
    return mod[action] !== false; // undefined ou true → concedido; false → negado
  }

  return (
    <PermissionContext.Provider value={{ permissions, can, loading }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}
