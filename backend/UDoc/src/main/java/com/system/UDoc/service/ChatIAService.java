package com.system.UDoc.service;

import com.system.UDoc.repository.CardRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ChatIAService {

    private final CardRepository cardRepository;
    private final AIService aiService;

    public ChatIAService(CardRepository cardRepository, AIService aiService) {
        this.cardRepository = cardRepository;
        this.aiService      = aiService;
    }

    /**
     * Responde uma pergunta do usuário usando pg_trgm para encontrar cards relevantes
     * e injetando-os como contexto no Groq.
     * O conteúdo dos cards é armazenado como HTML (Tiptap) — strip é feito antes de
     * montar o prompt para evitar que tags vazem para a resposta.
     */
    public String responder(String pergunta) {
        List<Map<String, Object>> cards = cardRepository.searchByTrgm(pergunta, 3);

        if (cards.isEmpty()) {
            return "Não encontrei informações sobre esse assunto nos documentos disponíveis.";
        }

        StringBuilder contexto = new StringBuilder();
        contexto.append("Você é um assistente de onboarding. Responda em português, de forma clara e direta.\n");
        contexto.append("REGRAS OBRIGATÓRIAS:\n");
        contexto.append("- Responda SOMENTE com texto puro. PROIBIDO usar HTML, markdown, tags, asteriscos ou qualquer formatação.\n");
        contexto.append("- Responda SOMENTE sobre o que foi perguntado. Não mencione outros documentos nem sugira alternativas.\n");
        contexto.append("- Use APENAS as informações dos documentos abaixo. Não invente nada.\n");
        contexto.append("- Se os documentos não contiverem a resposta, escreva apenas: \"Não encontrei informações sobre esse assunto nos documentos disponíveis.\"\n\n");
        contexto.append("DOCUMENTOS:\n");

        for (Map<String, Object> card : cards) {
            String titulo   = String.valueOf(card.getOrDefault("title",       ""));
            String desc     = String.valueOf(card.getOrDefault("description", ""));
            String conteudo = stripHtml(String.valueOf(card.getOrDefault("content", "")));

            contexto.append("---\n");
            contexto.append("Título: ").append(titulo).append("\n");
            if (!desc.isBlank())     contexto.append("Resumo: ").append(desc).append("\n");
            if (!conteudo.isBlank()) contexto.append("Conteúdo: ").append(conteudo).append("\n");
        }

        contexto.append("---\n");
        contexto.append("PERGUNTA: ").append(pergunta).append("\n\n");
        contexto.append("Resposta (somente texto puro, sem HTML, sem formatação, apenas sobre a pergunta feita):");

        try {
            return aiService.generate(contexto.toString()).content();
        } catch (Exception e) {
            return "Desculpe, estou com dificuldades técnicas no momento. Tente novamente em instantes.";
        }
    }

    /** Remove todas as tags HTML e entidades comuns, retornando texto limpo. */
    private String stripHtml(String html) {
        if (html == null || html.isBlank() || "null".equals(html)) return "";
        return html
                .replaceAll("<br\\s*/?>",           "\n")
                .replaceAll("<li[^>]*>",             "\n- ")
                .replaceAll("<[^>]+>",               " ")
                .replaceAll("&nbsp;",                " ")
                .replaceAll("&amp;",                 "&")
                .replaceAll("&lt;",                  "<")
                .replaceAll("&gt;",                  ">")
                .replaceAll("&quot;",                "\"")
                .replaceAll("&#39;",                 "'")
                .replaceAll("[ \\t]+",               " ")
                .replaceAll("\\n{3,}",               "\n\n")
                .trim();
    }

    /** Mensagem de boas-vindas automática */
    public String boasVindas() {
        return "Olá! 👋 Sou o assistente virtual do UDoc. " +
               "Como posso te ajudar hoje? Pode me fazer uma pergunta sobre os documentos e treinamentos disponíveis. " +
               "Se precisar falar com seu ISM responsável, acesse a **aba ISM**. 😊";
    }
}
