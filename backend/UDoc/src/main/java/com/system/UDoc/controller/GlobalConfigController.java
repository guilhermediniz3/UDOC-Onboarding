package com.system.UDoc.controller;

import com.system.UDoc.dto.StorageInfoDTO;
import com.system.UDoc.dto.VideoRecordingDTO;
import com.system.UDoc.entity.AIProvider;
import com.system.UDoc.entity.AuditLog;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.AuditLogRepository;
import com.system.UDoc.service.AIProviderKeyStore;
import com.system.UDoc.service.GlobalConfigService;
import com.system.UDoc.service.VideoRecordingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Configurações globais do sistema — restritas ao perfil ADMIN.
 * As chaves sensíveis são criptografadas antes de persistir e mascaradas na resposta.
 */
@RestController
@RequestMapping("/config")
@PreAuthorize("hasAnyAuthority('ADMIN','GESTOR')")
public class GlobalConfigController {

    private final GlobalConfigService configService;
    private final VideoRecordingService recordingService;
    private final AuditLogRepository auditLogRepo;
    private final AIProviderKeyStore keyStore;

    public GlobalConfigController(GlobalConfigService configService,
                                  VideoRecordingService recordingService,
                                  AuditLogRepository auditLogRepo,
                                  AIProviderKeyStore keyStore) {
        this.configService    = configService;
        this.recordingService = recordingService;
        this.auditLogRepo     = auditLogRepo;
        this.keyStore         = keyStore;
    }

    @GetMapping("/storage")
    public ResponseEntity<StorageInfoDTO> getStorageInfo() {
        return ResponseEntity.ok(configService.getStorageInfo());
    }

    @PutMapping("/storage/limit")
    public ResponseEntity<StorageInfoDTO> setLimit(
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal User user) {
        long bytes = body.getOrDefault("limitBytes", GlobalConfigService.DEFAULT_STORAGE_LIMIT);
        configService.setStorageLimitBytes(bytes);
        auditLogRepo.save(new AuditLog("STORAGE_LIMIT_CHANGED",
                GlobalConfigService.KEY_STORAGE_LIMIT,
                user != null ? user.getEmail() : "admin",
                "Limite alterado para " + bytes + " bytes"));
        return ResponseEntity.ok(configService.getStorageInfo());
    }

    @GetMapping("/recordings")
    public ResponseEntity<List<VideoRecordingDTO>> getAllRecordings() {
        return ResponseEntity.ok(recordingService.listAll());
    }

    /** Retorna configurações de integração com chaves mascaradas para exibição. */
    @GetMapping("/integrations")
    public ResponseEntity<Map<String, Object>> getIntegrations() {
        String sgPlain  = configService.getStringValue(GlobalConfigService.KEY_SENDGRID_API_KEY);
        String aiPlain  = configService.getStringValue(GlobalConfigService.KEY_AI_API_KEY);
        String mailFrom = configService.getStringValue(GlobalConfigService.KEY_MAIL_FROM);

        String aiActiveProvider = configService.getStringValue(GlobalConfigService.KEY_AI_ACTIVE_PROVIDER);
        String aiProviderKeysJson = configService.getStringValue(GlobalConfigService.KEY_AI_PROVIDER_KEYS);
        java.util.Map<AIProvider, String> providerKeys = keyStore.readKeys(aiProviderKeysJson);
        java.util.Map<AIProvider, String> maskedProviderKeys = keyStore.maskAll(providerKeys);
        java.util.Map<String, String> maskedProviderKeysStr = new java.util.LinkedHashMap<>();
        for (java.util.Map.Entry<AIProvider, String> e : maskedProviderKeys.entrySet()) {
            maskedProviderKeysStr.put(e.getKey().name(), e.getValue());
        }

        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("sendgridKey",      sgPlain  != null ? configService.maskKey(sgPlain) : "");
        resp.put("aiKey",            aiPlain  != null ? configService.maskKey(aiPlain) : "");
        resp.put("mailFrom",         mailFrom != null ? mailFrom : "");
        resp.put("aiActiveProvider", aiActiveProvider != null ? aiActiveProvider : "");
        resp.put("aiProviderKeys",   maskedProviderKeysStr);
        return ResponseEntity.ok(resp);
    }

    /**
     * Salva chaves de integração.
     * Chaves mascaradas (contêm "...") são ignoradas — o usuário não editou.
     * Suporta tanto o legado (aiKey = chave única Groq) quanto o novo mapa por provedor.
     */
    @PutMapping("/integrations")
    public ResponseEntity<Void> saveIntegrations(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        String performedBy = user != null ? user.getEmail() : "admin";

        String sg   = getString(body, "sendgridKey");
        String ai   = getString(body, "aiKey");
        String mail = getString(body, "mailFrom");
        if (!sg.contains("...")   && !sg.isBlank())   configService.setStringValue(GlobalConfigService.KEY_SENDGRID_API_KEY, sg, performedBy);
        if (!ai.contains("...")   && !ai.isBlank())   configService.setStringValue(GlobalConfigService.KEY_AI_API_KEY, ai, performedBy);
        if (!mail.isBlank())                          configService.setStringValue(GlobalConfigService.KEY_MAIL_FROM, mail, performedBy);

        if (body.containsKey("aiActiveProvider")) {
            String newActiveProvider = getString(body, "aiActiveProvider");
            configService.setStringValue(GlobalConfigService.KEY_AI_ACTIVE_PROVIDER, newActiveProvider.trim(), performedBy);
        }

        @SuppressWarnings("unchecked")
        java.util.Map<String, String> newKeysRaw = (java.util.Map<String, String>) body.get("aiProviderKeys");
        if (newKeysRaw != null && !newKeysRaw.isEmpty()) {
            java.util.Map<AIProvider, String> updates = new java.util.EnumMap<>(AIProvider.class);
            for (java.util.Map.Entry<String, String> entry : newKeysRaw.entrySet()) {
                AIProvider provider = AIProvider.fromString(entry.getKey());
                String val = entry.getValue();
                if (provider != null && (val == null || !val.contains("..."))) {
                    updates.put(provider, val != null ? val : "");
                }
            }
            if (!updates.isEmpty()) {
                String existing = configService.getStringValue(GlobalConfigService.KEY_AI_PROVIDER_KEYS);
                String merged = keyStore.mergeAndWrite(existing, updates);
                configService.setStringValue(GlobalConfigService.KEY_AI_PROVIDER_KEYS, merged != null ? merged : "", performedBy);
            }
        }

        return ResponseEntity.noContent().build();
    }

    private String getString(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v instanceof String s ? s : "";
    }

    /** Toggle global do chat */
    @PutMapping("/chat-toggle")
    public ResponseEntity<Void> setChatToggle(
            @RequestBody java.util.Map<String, Boolean> body,
            @AuthenticationPrincipal User user) {
        boolean habilitado = Boolean.TRUE.equals(body.get("habilitado"));
        configService.setStringValue("chat_habilitado", String.valueOf(habilitado),
                user != null ? user.getEmail() : "admin");
        return ResponseEntity.noContent().build();
    }

    /** Histórico de auditoria das configurações */
    @GetMapping("/audit")
    public ResponseEntity<List<AuditLog>> getAuditLog() {
        return ResponseEntity.ok(auditLogRepo.findTop50ByOrderByTimestampDesc());
    }
}
