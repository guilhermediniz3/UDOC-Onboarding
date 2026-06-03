import api from "./api";

export type GroupType = "FUNCIONARIO_INTERNO" | "FUNCIONARIO_EXTERNO" | "ISM";
export type ActionType = "VIEW" | "CREATE" | "EDIT" | "DELETE";

export interface PermissionDTO {
  id: number;
  groupType: GroupType;
  module: string;
  action: ActionType | string;
  granted: boolean;
  sensitive: boolean;
  description?: string;
}

export interface PermissionUpdateDTO {
  id: number;
  granted: boolean;
}

/** Mapa de permissões do usuário logado: module → action → boolean */
export type MyPermissions = Record<string, Record<string, boolean>>;

export async function getAllPermissions(): Promise<PermissionDTO[]> {
  const r = await api.get<PermissionDTO[]>("/permissions");
  return r.data;
}

export async function updatePermissions(updates: PermissionUpdateDTO[]): Promise<void> {
  await api.put("/permissions", updates);
}

export async function getMyPermissions(): Promise<MyPermissions> {
  const r = await api.get<MyPermissions>("/permissions/my");
  return r.data;
}
