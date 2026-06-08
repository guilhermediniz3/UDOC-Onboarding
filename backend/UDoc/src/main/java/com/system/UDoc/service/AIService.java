package com.system.UDoc.service;

import com.system.UDoc.dto.AIResponseDTO;
import com.system.UDoc.entity.AIProvider;
import com.system.UDoc.entity.Company;
import com.system.UDoc.entity.User;
import com.system.UDoc.exception.AIQuotaExceededException;
import com.system.UDoc.repository.EmployeeRepository;
import com.system.UDoc.service.ai.AIProviderClient;
import com.system.UDoc.service.ai.AIProviderRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Service
public class AIService {

    @Value("${ai.key}")
    private String defaultApiKey;

    @Value("${ai.model}")
    private String defaultGroqModel;

    private final RestTemplate restTemplate;
    private final GlobalConfigService configService;
    private final EncryptionService encryptionService;
    private final AIProviderKeyStore keyStore;
    private final AIProviderRegistry providerRegistry;
    private final EmployeeRepository employeeRepository;

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

    public AIService(RestTemplate restTemplate, GlobalConfigService configService,
                     EncryptionService encryptionService, AIProviderKeyStore keyStore,
                     AIProviderRegistry providerRegistry, EmployeeRepository employeeRepository) {
        this.restTemplate = restTemplate;
        this.configService = configService;
        this.encryptionService = encryptionService;
        this.keyStore = keyStore;
        this.providerRegistry = providerRegistry;
        this.employeeRepository = employeeRepository;
    }

    /** Provedor + chave + modelo já resolvidos, prontos para uma chamada de geração. */
    private record EffectiveConfig(AIProvider provider, String apiKey, String model) {}

    public AIResponseDTO generate(String userPrompt) {
        return generate(SYSTEM_INSTRUCTION, userPrompt);
    }

    /** Variante que permite customizar a instrução de sistema (ex: chat de Q&A, que não deve gerar HTML). */
    public AIResponseDTO generate(String systemInstruction, String userPrompt) {
        EffectiveConfig cfg = resolveEffectiveConfig();
        AIProviderClient client = providerRegistry.get(cfg.provider());

        HttpHeaders headers = client.buildHeaders(cfg.apiKey());
        Object body = client.buildRequestBody(cfg.model(), systemInstruction, userPrompt);
        HttpEntity<Object> request = new HttpEntity<>(body, headers);
        String url = client.endpointUrl(cfg.apiKey(), cfg.model());

        ResponseEntity<Map> response;
        try {
            response = restTemplate.postForEntity(url, request, Map.class);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 429) {
                throw new AIQuotaExceededException(cfg.provider());
            }
            throw e;
        }

        String content = client.parseContent(response);
        return new AIResponseDTO(content, cfg.provider().name().toLowerCase(), cfg.model());
    }

    /**
     * Resolve provedor + chave + modelo em cascata (mesmo prompt/fluxo para qualquer provedor):
     * 1) usuário autenticado (chave pessoal — economiza tokens da chave geral)
     * 2) empresa do usuário
     * 3) Configurações gerais (Integrações)
     * 4) padrão do application.properties (sempre Groq)
     */
    private EffectiveConfig resolveEffectiveConfig() {
        User user = currentUser();

        if (user != null) {
            String legacyUserKey = safeDecrypt(user.getAiApiKey());
            Optional<EffectiveConfig> userCfg =
                    resolveLevel(user.getAiActiveProvider(), user.getAiProviderKeys(), legacyUserKey);
            if (userCfg.isPresent()) return userCfg.get();

            Optional<Company> company = employeeRepository.findByUserId(user.getId()).map(emp -> emp.getCompany());
            if (company.isPresent()) {
                Optional<EffectiveConfig> companyCfg = resolveLevel(
                        company.get().getAiActiveProvider(), company.get().getAiProviderKeys(), null);
                if (companyCfg.isPresent()) return companyCfg.get();
            }
        }

        String globalActiveProvider = configService.getStringValue(GlobalConfigService.KEY_AI_ACTIVE_PROVIDER);
        String globalProviderKeys   = configService.getStringValue(GlobalConfigService.KEY_AI_PROVIDER_KEYS);
        String legacyGlobalKey      = configService.getStringValue(GlobalConfigService.KEY_AI_API_KEY);
        Optional<EffectiveConfig> globalCfg = resolveLevel(globalActiveProvider, globalProviderKeys, legacyGlobalKey);
        if (globalCfg.isPresent()) return globalCfg.get();

        return new EffectiveConfig(AIProvider.GROQ, defaultApiKey, defaultGroqModel);
    }

    /**
     * Resolve um nível (usuário/empresa/config global).
     * Ordem de precedência dentro do nível:
     *   1) provedor ativo explícito + chave no novo mapa por provedor
     *   2) provedor ativo = GROQ + chave legada (campo único antigo)
     *   3) sem provedor ativo, mas há chave legada → usa GROQ com ela (retrocompatibilidade)
     */
    private Optional<EffectiveConfig> resolveLevel(String activeProviderRaw, String providerKeysJson, String legacyGroqKey) {
        AIProvider provider = AIProvider.fromString(activeProviderRaw);

        if (provider == null) {
            // Sem provedor ativo selecionado — retrocompatibilidade: usa chave legada Groq
            if (legacyGroqKey != null && !legacyGroqKey.isBlank()) {
                return Optional.of(new EffectiveConfig(AIProvider.GROQ, legacyGroqKey, defaultGroqModel));
            }
            return Optional.empty();
        }

        Map<AIProvider, String> keys = keyStore.readKeys(providerKeysJson);
        String key = keys.get(provider);
        if ((key == null || key.isBlank()) && provider == AIProvider.GROQ
                && legacyGroqKey != null && !legacyGroqKey.isBlank()) {
            key = legacyGroqKey;
        }
        if (key == null || key.isBlank()) return Optional.empty();

        return Optional.of(new EffectiveConfig(provider, key, modelFor(provider)));
    }

    private String modelFor(AIProvider provider) {
        if (provider == AIProvider.GROQ) return defaultGroqModel;
        return providerRegistry.get(provider).defaultModel();
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) return user;
        return null;
    }

    private String safeDecrypt(String encrypted) {
        if (encrypted == null || encrypted.isBlank()) return null;
        try {
            return encryptionService.decrypt(encrypted);
        } catch (Exception e) {
            return null; // chave corrompida/ilegível — ignora
        }
    }
}
