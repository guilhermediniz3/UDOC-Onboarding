import api from "./api";

export interface NotificationItem {
  id: number;
  userId: number;
  type: "CARD_CREATED" | "CARD_UPDATED" | "TRAIL_CREATED" | "TRAIL_UPDATED";
  title: string;
  referenceId?: number;
  referenceType?: "CARD" | "TRAIL";
  read: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface NotifPage {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export async function getNotifications(page = 0, size = 20): Promise<NotifPage> {
  const r = await api.get<NotifPage>("/notifications", { params: { page, size } });
  return r.data;
}

export async function getUnreadCount(): Promise<number> {
  const r = await api.get<{ total: number }>("/notifications/unread-count");
  return r.data.total;
}

export async function markAsRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
