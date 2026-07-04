package com.system.UDoc.service;

import com.system.UDoc.dto.TranscricaoTrechoDTO;
import com.system.UDoc.dto.TranscricaoTrechoRequestDTO;
import com.system.UDoc.entity.AuditLog;
import com.system.UDoc.entity.TranscricaoTrecho;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.AuditLogRepository;
import com.system.UDoc.repository.TranscricaoTrechoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TranscricaoService {

    private final TranscricaoTrechoRepository transcricaoRepository;
    private final AuditLogRepository auditLogRepository;

    public TranscricaoService(
            TranscricaoTrechoRepository transcricaoRepository,
            AuditLogRepository auditLogRepository) {
        this.transcricaoRepository = transcricaoRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public TranscricaoTrechoDTO salvarTrecho(TranscricaoTrechoRequestDTO req, User usuario) {
        TranscricaoTrecho trecho = new TranscricaoTrecho();
        trecho.setTrainingRoomId(req.getTrainingRoomId());
        trecho.setUsuarioId(usuario.getId());
        trecho.setTexto(req.getTexto());
        TranscricaoTrecho saved = transcricaoRepository.save(trecho);

        // Registra início de captura apenas no primeiro trecho da sessão
        long count = transcricaoRepository.countByTrainingRoomId(req.getTrainingRoomId());
        if (count == 1) {
            auditLogRepository.save(new AuditLog(
                    "TRANSCRICAO", "INICIAR_CAPTURA",
                    "training-room#" + req.getTrainingRoomId(),
                    usuario.getEmail(),
                    "Captura de transcrição iniciada"));
        }

        return new TranscricaoTrechoDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<TranscricaoTrechoDTO> listarPorSala(Long trainingRoomId) {
        return transcricaoRepository
                .findByTrainingRoomIdOrderByTimestampAsc(trainingRoomId)
                .stream()
                .map(TranscricaoTrechoDTO::new)
                .toList();
    }
}
