package com.system.UDoc.service.ai;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import java.util.Map;

/**
 * Estratégia por provedor de IA — encapsula tudo que difere entre eles (URL, autenticação,
 * formato do corpo da requisição e formato da resposta), para que AIService possa falar
 * com qualquer um usando o MESMO prompt/fluxo já existente.
 */
public interface AIProviderClient {

    /** URL do endpoint de geração para o modelo informado */
    String endpointUrl(String apiKey, String model);

    /** Cabeçalhos HTTP (autenticação varia: Bearer, x-api-key, ou nem aparece — vai na URL) */
    HttpHeaders buildHeaders(String apiKey);

    /** Corpo da requisição no formato esperado pelo provedor */
    Object buildRequestBody(String model, String systemInstruction, String userPrompt);

    /** Extrai o texto gerado da resposta (formato varia por provedor) */
    String parseContent(ResponseEntity<Map> response);

    /** Modelo padrão a usar quando nenhum for configurado explicitamente */
    String defaultModel();
}
