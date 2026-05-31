import api from "./api";

import type { Card } from "../types/Card";

import type { PaginationResponse } from "../types/Pagination";

interface GetCardsParams {
  page?: number;

  size?: number;

  search?: string;

  active?: boolean | null;
}

interface UserCardViewResponse {
  id: number;

  content: string;
}

export async function getCards({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetCardsParams = {}): Promise<PaginationResponse<Card>> {

  const response =
    await api.get<
      PaginationResponse<Card>
    >("/cards", {
      params: {
        page,
        size,
        search,

        active:
          active === null
            ? undefined
            : active,
      },
    });

  return response.data;
}

export async function getCardById(
  id: number
): Promise<Card> {

  const response =
    await api.get<Card>(
      `/cards/${id}`
    );

  return response.data;
}

export async function getCardViewById(
  id: number
): Promise<UserCardViewResponse> {

  const response =
    await api.get<UserCardViewResponse>(
      `/cards/view/${id}`
    );

  return response.data;
}

export async function createCard(
  card: Card
): Promise<Card> {

  const response =
    await api.post<Card>(
      "/cards",
      card
    );

  return response.data;
}

export async function updateCard(
  card: Card
): Promise<Card> {

  const response =
    await api.put<Card>(
      `/cards/${card.id}`,
      card
    );

  return response.data;
}

export async function saveCard(
  card: Card
): Promise<Card> {

  if (card.id) {
    return updateCard(card);
  }

  return createCard(card);
}

export async function deleteCard(
  id: number
): Promise<void> {

  await api.delete(
    `/cards/${id}`
  );
}

export async function cloneCard(
  id: number
): Promise<Card> {

  const response =
    await api.post<Card>(
      `/cards/${id}/clone`
    );

  return response.data;
}