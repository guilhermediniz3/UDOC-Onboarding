import api from "./api";

export const generateAIContent = async (prompt: string): Promise<string> => {
  const { data } = await api.post("/ai/generate", {
    prompt,
    documentType: "document",
  });

  return data.content;
};