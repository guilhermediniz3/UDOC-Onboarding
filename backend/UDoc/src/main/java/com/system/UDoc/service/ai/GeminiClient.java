package com.system.UDoc.service.ai;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

/**
 * Implementação para o Google Gemini — formato de requisição/resposta próprio:
 * autenticação via query param "key", corpo com "contents"/"systemInstruction",
 * resposta em candidates[0].content.parts[0].text.
 */
public class GeminiClient implements AIProviderClient {

    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String DEFAULT_MODEL = "gemini-2.0-flash";

    @Override
    public String endpointUrl(String apiKey, String model) {
        String effectiveModel = (model == null || model.isBlank()) ? DEFAULT_MODEL : model;
        return BASE_URL + effectiveModel + ":generateContent?key=" + apiKey;
    }

    @Override
    public HttpHeaders buildHeaders(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    @Override
    public Object buildRequestBody(String model, String systemInstruction, String userPrompt) {
        return Map.of(
                "systemInstruction", Map.of(
                        "parts", List.of(Map.of("text", systemInstruction))
                ),
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)))
                ),
                "generationConfig", Map.of("maxOutputTokens", 4096)
        );
    }

    @Override
    @SuppressWarnings("unchecked")
    public String parseContent(ResponseEntity<Map> response) {
        List<Map> candidates = (List<Map>) response.getBody().get("candidates");
        Map content = (Map) candidates.get(0).get("content");
        List<Map> parts = (List<Map>) content.get("parts");
        return (String) parts.get(0).get("text");
    }

    @Override
    public String defaultModel() {
        return DEFAULT_MODEL;
    }
}
