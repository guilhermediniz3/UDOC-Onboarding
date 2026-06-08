package com.system.UDoc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.system.UDoc.entity.AIProvider;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Serializa/criptografa o mapa "provedor → chave" guardado em uma única coluna TEXT (JSON),
 * usado por User, Company e GlobalConfig. Cada chave é criptografada individualmente —
 * permite mascarar/atualizar uma sem decifrar as demais.
 */
@Service
public class AIProviderKeyStore {

    private final EncryptionService encryptionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AIProviderKeyStore(EncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }

    /** Lê o JSON persistido e devolve um mapa provedor → chave em texto plano (decifrada). */
    public Map<AIProvider, String> readKeys(String json) {
        Map<AIProvider, String> result = new EnumMap<>(AIProvider.class);
        if (json == null || json.isBlank()) return result;
        try {
            Map<String, String> raw = objectMapper.readValue(json, Map.class);
            for (Map.Entry<String, String> entry : raw.entrySet()) {
                AIProvider provider = AIProvider.fromString(entry.getKey());
                String encrypted = entry.getValue();
                if (provider == null || encrypted == null || encrypted.isBlank()) continue;
                try {
                    result.put(provider, encryptionService.decrypt(encrypted));
                } catch (Exception ignored) {
                    // chave corrompida/ilegível — ignora essa entrada
                }
            }
        } catch (Exception ignored) {
            // JSON inválido/legado — devolve mapa vazio
        }
        return result;
    }

    /**
     * Mescla as chaves novas (texto plano) com as já persistidas, criptografa e serializa de volta.
     * Uma entrada com valor em branco remove o provedor do mapa.
     */
    public String mergeAndWrite(String existingJson, Map<AIProvider, String> plainUpdates) {
        Map<AIProvider, String> current = readKeys(existingJson);
        for (Map.Entry<AIProvider, String> entry : plainUpdates.entrySet()) {
            String value = entry.getValue();
            if (value == null || value.isBlank()) {
                current.remove(entry.getKey());
            } else {
                current.put(entry.getKey(), value.trim());
            }
        }
        if (current.isEmpty()) return null;

        Map<String, String> toPersist = new LinkedHashMap<>();
        for (Map.Entry<AIProvider, String> entry : current.entrySet()) {
            toPersist.put(entry.getKey().name(), encryptionService.encrypt(entry.getValue()));
        }
        try {
            return objectMapper.writeValueAsString(toPersist);
        } catch (Exception e) {
            throw new RuntimeException("Falha ao serializar chaves de IA");
        }
    }

    /** Mascara cada chave em texto plano para exibição (prefixo + "..." + últimos 4 caracteres). */
    public Map<AIProvider, String> maskAll(Map<AIProvider, String> plainKeys) {
        Map<AIProvider, String> masked = new EnumMap<>(AIProvider.class);
        for (Map.Entry<AIProvider, String> entry : plainKeys.entrySet()) {
            masked.put(entry.getKey(), maskKey(entry.getValue()));
        }
        return masked;
    }

    public String maskKey(String plainValue) {
        if (plainValue == null || plainValue.isBlank()) return null;
        int len = plainValue.length();
        if (len <= 8) return "***";
        int prefixLen = Math.min(6, len - 4);
        return plainValue.substring(0, prefixLen) + "..." + plainValue.substring(len - 4);
    }
}
