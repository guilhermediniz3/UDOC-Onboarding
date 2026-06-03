package com.system.UDoc.service;

import com.system.UDoc.dto.NpsChatIsmDTO;
import com.system.UDoc.entity.AuditLog;
import com.system.UDoc.repository.AuditLogRepository;
import com.system.UDoc.repository.ChatAvaliacaoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditoriaService {

    private final AuditLogRepository        auditLogRepo;
    private final ChatAvaliacaoRepository   avaliacaoRepo;

    public AuditoriaService(AuditLogRepository auditLogRepo,
                            ChatAvaliacaoRepository avaliacaoRepo) {
        this.auditLogRepo  = auditLogRepo;
        this.avaliacaoRepo = avaliacaoRepo;
    }

    // ── Aba 3: Sistema — audit_log paginado com filtros ───────────────────────

    @Transactional(readOnly = true)
    public Page<AuditLog> buscarLogsSistema(
            String module, String action, String performedBy,
            String startDate, String endDate, Pageable pageable) {
        return auditLogRepo.searchAuditLogs(
                normalizar(module), normalizar(action), normalizar(performedBy),
                normalizar(startDate), normalizar(endDate), pageable);
    }

    // ── Aba 2: NPS Chat por ISM ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NpsChatIsmDTO> npsChat(Long ismId, String startDate, String endDate) {
        return avaliacaoRepo.npsAgrupadoPorIsm(ismId, normalizar(startDate), normalizar(endDate))
                .stream()
                .map(NpsChatIsmDTO::fromRow)
                .toList();
    }

    private String normalizar(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
