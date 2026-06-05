import api from "./api";

export type EnrollStatus = "AVAILABLE" | "ENROLLED" | "IN_PROGRESS" | "COMPLETED";

export interface CatalogTrail {
  id: number;
  name: string;
  description?: string;
  totalCards: number;
  visibilidade: "INTERNA" | "EXTERNA" | "AMBAS";
  enrollStatus: EnrollStatus;
}

export async function getCatalog(search?: string): Promise<CatalogTrail[]> {
  const r = await api.get<CatalogTrail[]>("/catalog", {
    params: search?.trim() ? { search } : undefined,
  });
  return r.data;
}

export async function enrollTrail(trailId: number): Promise<void> {
  await api.post(`/catalog/${trailId}/enroll`);
}
