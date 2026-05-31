import api from "./api";
import type { TrainingRoom } from "../types/TrainingRoom";
import type { PaginationResponse } from "../types/Pagination";

interface GetRoomsParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean | null;
}

interface TrainingRoomRequest {
  title: string;
  description: string;
  companyId?: number | null;
  ismId?: number | null;
  trailId?: number | null;
  sortOrder: number;
  status: string;
  vimeoUrl?: string;
  youtubeUrl?: string;
  active: boolean;
  invitedEmployeeIds?: number[];
}

export async function getTrainingRooms({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetRoomsParams = {}): Promise<PaginationResponse<TrainingRoom>> {
  const response = await api.get<PaginationResponse<TrainingRoom>>("/training-rooms", {
    params: { page, size, search, active: active === null ? undefined : active },
  });
  return response.data;
}

export async function getTrainingRoomById(id: number): Promise<TrainingRoom> {
  const response = await api.get<TrainingRoom>(`/training-rooms/${id}`);
  return response.data;
}

export async function createTrainingRoom(data: TrainingRoomRequest): Promise<TrainingRoom> {
  const response = await api.post<TrainingRoom>("/training-rooms", data);
  return response.data;
}

export async function updateTrainingRoom(
  id: number,
  data: TrainingRoomRequest
): Promise<TrainingRoom> {
  const response = await api.put<TrainingRoom>(`/training-rooms/${id}`, data);
  return response.data;
}

export async function deleteTrainingRoom(id: number): Promise<void> {
  await api.delete(`/training-rooms/${id}`);
}
