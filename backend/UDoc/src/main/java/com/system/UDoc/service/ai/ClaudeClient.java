package com.system.UDoc.service.ai;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

/**
 * Implementação para a Anthropic (Claude) — autenticação via header "x-api-key" +
 * "anthropic-version", corpo com "system"/"messages", resposta em content[0].text.
 */
public class ClaudeClient implements AIProviderClient {

    private static final String URL = "https://api.anthropic.com/v1/messages";
    private static final String DEFAULT_MODEL = "claude-3-5-haiku-latest";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    @Override
    public String endpointUrl(String apiKey, String model) {
        return URL;
    }

    @Override
    public HttpHeaders buildHeaders(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", ANTHROPIC_VERSION);
        return headers;
    }

    @Override
    public Object buildRequestBody(String model, String systemInstruction, String userPrompt) {
        return Map.of(
                "model", model,
                "max_tokens", 4096,
                "system", systemInstruction,
                "messages", List.of(
                        Map.of("role", "user", "content", userPrompt)
                )
        );
    }

    @Override
    @SuppressWarnings("unchecked")
    public String parseContent(ResponseEntity<Map> response) {
        List<Map> content = (List<Map>) response.getBody().get("content");
        return (String) content.get(0).get("text");
    }

    @Override
    public String defaultModel() {
        return DEFAULT_MODEL;
    }
}
