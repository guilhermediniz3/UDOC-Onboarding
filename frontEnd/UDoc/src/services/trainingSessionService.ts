import api from "./api";

export interface TrainingSessionData {
  id?: number;
  trainingRoomId?: number;
  dayNumber: number;
  date: string;       // ISO date: "2026-01-15"
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
}

export interface CalendarSession {
  sessionId: number;
  trainingRoomId: number;
  trainingRoomTitle: string;
  trainingRoomStatus: string;
  dayNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  ismId?: number;
  ismName?: string;
  companyId?: number;
  companyName?: string;
  invitedEmployeeIds?: number[];
  invitedEmployeeNames?: string[];
}

export interface ConflictDetail {
  conflictType: "ISM" | "COMPANY" | "EMPLOYEE";
  entityName: string;
  trainingRoomTitle: string;
  date: string;
  startTime: string;
  endTime: string;
}

export async function getSessionsByRoom(roomId: number): Promise<TrainingSessionData[]> {
  const r = await api.get<TrainingSessionData[]>(`/training-rooms/${roomId}/sessions`);
  return r.data;
}

export async function replaceRoomSessions(
  roomId: number,
  sessions: TrainingSessionData[]
): Promise<TrainingSessionData[]> {
  const r = await api.put<TrainingSessionData[]>(`/training-rooms/${roomId}/sessions`, sessions);
  return r.data;
}

export async function deleteRoomSessions(roomId: number): Promise<void> {
  await api.delete(`/training-rooms/${roomId}/sessions`);
}

export async function getCalendarSessions(params: {
  month: number;
  year: number;
  ismId?: number | null;
  companyId?: number | null;
  employeeId?: number | null;
}): Promise<CalendarSession[]> {
  const r = await api.get<CalendarSession[]>("/training-sessions/calendar", { params });
  return r.data;
}
