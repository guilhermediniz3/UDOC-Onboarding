package com.system.UDoc.controller;

import com.system.UDoc.dto.StorageInfoDTO;
import com.system.UDoc.dto.VideoRecordingDTO;
import com.system.UDoc.entity.AuditLog;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.AuditLogRepository;
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
@PreAuthorize("hasAuthority('ADMIN')")
public class GlobalConfigController {

    private final GlobalConfigService configService;
    private final VideoRecordingService recordingService;
    private final AuditLogRepository auditLogRepo;

    public GlobalConfigController(GlobalConfigService configService,
                                  VideoRecordingService recordingService,
                                  AuditLogRepository auditLogRepo) {
        this.configService    = configService;
        this.recordingService = recordingService;
        this.auditLogRepo     = auditLogRepo;
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

    /** Retorna configurações de integração com chaves mascaradas para exibição */
    @GetMapping("/integrations")
    public ResponseEntity<Map<String, String>> getIntegrations() {
        String sgPlain  = configService.getStringValue(GlobalConfigService.KEY_SENDGRID_API_KEY);
        String aiPlain  = configService.getStringValue(GlobalConfigService.KEY_AI_API_KEY);
        String mailFrom = configService.getStringValue(GlobalConfigService.KEY_MAIL_FROM);
        Map<String, String> resp = new java.util.LinkedHashMap<>();
        resp.put("sendgridKey", sgPlain  != null ? configService.maskKey(sgPlain) : "");
        resp.put("aiKey",       aiPlain  != null ? configService.maskKey(aiPlain) : "");
        resp.put("mailFrom",    mailFrom != null ? mailFrom : "");
        return ResponseEntity.ok(resp);
    }

    /**
     * Salva chaves de integração.
     * Campos que começam com o padrão mascarado (ex: gsk_...) não são salvos — sem alteração.
     * Valores são criptografados pelo GlobalConfigService antes de persistir.
     */
    @PutMapping("/integrations")
    public ResponseEntity<Void> saveIntegrations(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String performedBy = user != null ? user.getEmail() : "admin";
        String sg   = body.getOrDefault("sendgridKey", "");
        String ai   = body.getOrDefault("aiKey", "");
        String mail = body.getOrDefault("mailFrom", "");
        // Ignora campos que não foram editados (contêm o valor mascarado devolvido pelo GET)
        if (!sg.contains("...")   && !sg.isBlank())   configService.setStringValue(GlobalConfigService.KEY_SENDGRID_API_KEY, sg, performedBy);
        if (!ai.contains("...")   && !ai.isBlank())   configService.setStringValue(GlobalConfigService.KEY_AI_API_KEY, ai, performedBy);
        if (!mail.isBlank())                          configService.setStringValue(GlobalConfigService.KEY_MAIL_FROM, mail, performedBy);
        return ResponseEntity.noContent().build();
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
