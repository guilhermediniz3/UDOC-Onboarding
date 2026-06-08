package com.system.UDoc.service;

import com.system.UDoc.dto.StorageInfoDTO;
import com.system.UDoc.entity.AuditLog;
import com.system.UDoc.entity.GlobalConfig;
import com.system.UDoc.repository.AuditLogRepository;
import com.system.UDoc.repository.GlobalConfigRepository;
import com.system.UDoc.repository.VideoRecordingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Chaves sensíveis — criptografadas no banco, descriptografadas apenas em memória para uso interno */
@Service
public class GlobalConfigService {

    /** 10 GB padrão */
    public static final long DEFAULT_STORAGE_LIMIT = 10L * 1024 * 1024 * 1024;
    public static final String KEY_STORAGE_LIMIT   = "storage_gravacoes_limite_bytes";

    /** Chaves de integração — valores criptografados no banco */
    public static final String KEY_SENDGRID_API_KEY = "sendgrid_api_key";
    /** @deprecated chave única legada (sempre Groq) — mantida só como fallback de leitura; ver KEY_AI_PROVIDER_KEYS */
    @Deprecated
    public static final String KEY_AI_API_KEY        = "ai_api_key";
    public static final String KEY_MAIL_FROM         = "mail_from_address";

    /** Provedor de IA ativo das Configurações gerais (GROQ, GEMINI, OPENAI, DEEPSEEK, CLAUDE) */
    public static final String KEY_AI_ACTIVE_PROVIDER = "ai_active_provider";
    /** Mapa JSON {"GROQ": "<criptografada>", ...} — cada entrada já vem criptografada individualmente
     *  (ver AIProviderKeyStore), por isso NÃO entra em SENSITIVE_KEYS — evitaria dupla criptografia. */
    public static final String KEY_AI_PROVIDER_KEYS   = "ai_provider_keys";

    private final GlobalConfigRepository configRepo;
    private final VideoRecordingRepository recordingRepo;
    private final EncryptionService encryptionService;
    private final AuditLogRepository auditLogRepo;

    public GlobalConfigService(GlobalConfigRepository configRepo,
                               VideoRecordingRepository recordingRepo,
                               EncryptionService encryptionService,
                               AuditLogRepository auditLogRepo) {
        this.configRepo        = configRepo;
        this.recordingRepo     = recordingRepo;
        this.encryptionService = encryptionService;
        this.auditLogRepo      = auditLogRepo;
    }

    /** Chaves que devem ser criptografadas no banco */
    private static final java.util.Set<String> SENSITIVE_KEYS = java.util.Set.of(
        KEY_SENDGRID_API_KEY, KEY_AI_API_KEY
    );

    @Transactional(readOnly = true)
    public long getStorageLimitBytes() {
        return configRepo.findByChave(KEY_STORAGE_LIMIT)
                .map(c -> {
                    try { return Long.parseLong(c.getValor()); }
                    catch (NumberFormatException e) { return DEFAULT_STORAGE_LIMIT; }
                })
                .orElse(DEFAULT_STORAGE_LIMIT);
    }

    @Transactional
    public void setStorageLimitBytes(long bytes) {
        GlobalConfig cfg = configRepo.findByChave(KEY_STORAGE_LIMIT)
                .orElse(new GlobalConfig(KEY_STORAGE_LIMIT, null));
        cfg.setValor(String.valueOf(bytes));
        configRepo.save(cfg);
    }

    @Transactional(readOnly = true)
    public long getUsedBytes() {
        Long sum = recordingRepo.sumFileSizes();
        return sum != null ? sum : 0L;
    }

    @Transactional(readOnly = true)
    public StorageInfoDTO getStorageInfo() {
        return new StorageInfoDTO(getStorageLimitBytes(), getUsedBytes());
    }

    // ── Configurações genéricas de chave/valor ─────────────────────────────────

    /**
     * Lê e descriptografa o valor (se for chave sensível).
     * Retorna o VALOR REAL — use apenas internamente para chamadas de API.
     */
    @Transactional(readOnly = true)
    public String getStringValue(String key) {
        String raw = configRepo.findByChave(key).map(GlobalConfig::getValor).orElse(null);
        if (raw == null) return null;
        if (SENSITIVE_KEYS.contains(key)) {
            try { return encryptionService.decrypt(raw); }
            catch (Exception e) { return raw; } // fallback se ainda não estava criptografado
        }
        return raw;
    }

    /**
     * Criptografa (se chave sensível) e salva.
     * Registra auditoria sem o valor.
     */
    @Transactional
    public void setStringValue(String key, String value) {
        setStringValue(key, value, null);
    }

    @Transactional
    public void setStringValue(String key, String value, String performedBy) {
        String toStore = SENSITIVE_KEYS.contains(key)
                ? encryptionService.encrypt(value)
                : value;
        GlobalConfig cfg = configRepo.findByChave(key).orElse(new GlobalConfig(key, null));
        cfg.setValor(toStore);
        configRepo.save(cfg);
        // Auditoria — sem o valor
        auditLogRepo.save(new AuditLog(
            "CONFIG_KEY_UPDATED", key,
            performedBy != null ? performedBy : "system",
            "Chave '" + key + "' atualizada" + (performedBy != null ? " por " + performedBy : "")
        ));
    }

    /** Mascara para exibição: mostra prefixo e últimos 4 chars */
    public String maskKey(String plainValue) {
        if (plainValue == null || plainValue.isBlank()) return null;
        int len = plainValue.length();
        if (len <= 8) return "***";
        int prefixLen = Math.min(6, len - 4);
        return plainValue.substring(0, prefixLen) + "..." + plainValue.substring(len - 4);
    }

    /** Lança 403 se a cota estiver esgotada */
    @Transactional(readOnly = true)
    public void checkQuota() {
        long limit = getStorageLimitBytes();
        long used  = getUsedBytes();
        if (used >= limit) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Cota de armazenamento esgotada. Acesse as configurações para liberar espaço ou aumentar a cota.");
        }
    }
}
