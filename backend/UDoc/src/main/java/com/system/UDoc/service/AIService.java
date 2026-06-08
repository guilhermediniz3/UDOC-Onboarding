package com.system.UDoc.service;

import com.system.UDoc.dto.AIResponseDTO;
import com.system.UDoc.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AIService {

    @Value("${ai.key}")
    private String apiKey;

    @Value("${ai.model}")
    private String model;

    private final RestTemplate restTemplate;
    private final GlobalConfigService configService;
    private final EncryptionService encryptionService;

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    private static final String SYSTEM_INSTRUCTION = """
        Você é um assistente especializado em criar documentos profissionais em português brasileiro.
        Gere o conteúdo em formato HTML usando apenas as tags:
        <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <br>.
        REGRA ABSOLUTA: Retorne APENAS o HTML puro, começando obrigatoriamente com uma tag HTML.
        NUNCA use markdown. NUNCA use ** para negrito. NUNCA use # para títulos.
        Não inclua explicações, não inclua ```html, comece direto com a tag HTML.
        IMPORTANTE: Gere documentos COMPLETOS e DETALHADOS, com no mínimo 5 seções bem desenvolvidas.
        Use <h1> para o título principal, <h2> para seções e <h3> para subseções.
        Use <ol> para listas numeradas e <ul> para listas com marcadores.
        Cada seção deve ter pelo menos 3 parágrafos ou itens. Não resuma, detalhe ao máximo.
        """;

    public AIService(RestTemplate restTemplate, GlobalConfigService configService, EncryptionService encryptionService) {
        this.restTemplate = restTemplate;
        this.configService = configService;
        this.encryptionService = encryptionService;
    }

    /**
     * Resolve a chave efetiva a usar, em ordem de prioridade:
     * 1) chave pessoal do usuário autenticado (economiza tokens da chave geral)
     * 2) chave geral configurada no banco (Configurações → Integrações)
     * 3) chave padrão do application.properties
     */
    private String resolveEffectiveKey() {
        String personalKey = currentUserPersonalKey();
        if (personalKey != null && !personalKey.isBlank()) return personalKey;

        String dbKey = configService.getStringValue(GlobalConfigService.KEY_AI_API_KEY);
        if (dbKey != null && !dbKey.isBlank()) return dbKey;

        return apiKey;
    }

    private String currentUserPersonalKey() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) return null;

        String encrypted = user.getAiApiKey();
        if (encrypted == null || encrypted.isBlank()) return null;
        try {
            return encryptionService.decrypt(encrypted);
        } catch (Exception e) {
            return null; // chave corrompida/ilegível — cai para a chave geral
        }
    }

    public AIResponseDTO generate(String userPrompt) {
        return generate(SYSTEM_INSTRUCTION, userPrompt);
    }

    /** Variante que permite customizar a instrução de sistema (ex: chat de Q&A, que não deve gerar HTML). */
    public AIResponseDTO generate(String systemInstruction, String userPrompt) {

        String effectiveKey = resolveEffectiveKey();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(effectiveKey);

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemInstruction),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "max_tokens", 4096
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(GROQ_URL, request, Map.class);

        List<Map> choices =
                (List<Map>) response.getBody().get("choices");

        Map message =
                (Map) choices.get(0).get("message");

        String content =
                (String) message.get("content");

        return new AIResponseDTO(content, "groq", model);
    }
}