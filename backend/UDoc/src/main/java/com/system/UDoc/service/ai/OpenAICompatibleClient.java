package com.system.UDoc.service.ai;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

/**
 * Implementação para provedores que falam o dialeto "OpenAI Chat Completions"
 * (Groq, OpenAI/GPT e DeepSeek): mesmo formato de requisição/resposta,
 * só mudam a URL base, o modelo padrão e a chave de autenticação (Bearer).
 */
public class OpenAICompatibleClient implements AIProviderClient {

    private final String chatCompletionsUrl;
    private final String defaultModel;

    public OpenAICompatibleClient(String chatCompletionsUrl, String defaultModel) {
        this.chatCompletionsUrl = chatCompletionsUrl;
        this.defaultModel = defaultModel;
    }

    @Override
    public String endpointUrl(String apiKey, String model) {
        return chatCompletionsUrl;
    }

    @Override
    public HttpHeaders buildHeaders(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        return headers;
    }

    @Override
    public Object buildRequestBody(String model, String systemInstruction, String userPrompt) {
        return Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemInstruction),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "max_tokens", 4096
        );
    }

    @Override
    @SuppressWarnings("unchecked")
    public String parseContent(ResponseEntity<Map> response) {
        List<Map> choices = (List<Map>) response.getBody().get("choices");
        Map message = (Map) choices.get(0).get("message");
        return (String) message.get("content");
    }

    @Override
    public String defaultModel() {
        return defaultModel;
    }
}
