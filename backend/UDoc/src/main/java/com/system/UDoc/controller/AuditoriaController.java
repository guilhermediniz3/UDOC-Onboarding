package com.system.UDoc.controller;

import com.system.UDoc.dto.ChatConversaDTO;
import com.system.UDoc.dto.NpsChatIsmDTO;
import com.system.UDoc.entity.AuditLog;
import com.system.UDoc.service.AuditoriaService;
import com.system.UDoc.service.ChatService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints do módulo de Auditoria — restritos a ADMIN.
 * Aba 1: Conversas      → delega para ChatService (já existia em /chat/admin)
 * Aba 2: NPS Chat       → agrega avaliações por ISM
 * Aba 3: Sistema        → audit_log paginado com filtros
 */
@RestController
@RequestMapping("/auditoria")
@PreAuthorize("hasAuthority('ADMIN')")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;
    private final ChatService      chatService;

    public AuditoriaController(AuditoriaService auditoriaService, ChatService chatService) {
        this.auditoriaService = auditoriaService;
        this.chatService      = chatService;
    }

    // ── Aba 1: Conversas ──────────────────────────────────────────────────────

    @GetMapping("/conversas")
    public ResponseEntity<Page<ChatConversaDTO>> listarConversas(
            @RequestParam(required = false) Long   ismId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(chatService.listarConversasAdmin(
                ismId, status, PageRequest.of(page, size, Sort.by("criadaEm").descending())));
    }

    @GetMapping("/conversas/{id}")
    public ResponseEntity<ChatConversaDTO> detalharConversa(@PathVariable Long id) {
        return ResponseEntity.ok(chatService.detalharConversaAdmin(id));
    }

    // ── Aba 2: NPS Chat ───────────────────────────────────────────────────────

    @GetMapping("/nps-chat")
    public ResponseEntity<List<NpsChatIsmDTO>> npsChat(
            @RequestParam(required = false) Long   ismId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(auditoriaService.npsChat(ismId, startDate, endDate));
    }

    // ── Aba 3: Sistema — audit_log ────────────────────────────────────────────

    @GetMapping("/sistema")
    public ResponseEntity<Page<AuditLog>> logsSistema(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(auditoriaService.buscarLogsSistema(
                module, action, performedBy, startDate, endDate,
                PageRequest.of(page, size, Sort.by("timestamp").descending())));
    }
}
