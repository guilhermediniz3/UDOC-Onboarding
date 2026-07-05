package com.system.UDoc.service;

import com.system.UDoc.dto.SessaoTreinamentoDTO;
import com.system.UDoc.entity.*;
import com.system.UDoc.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Service
public class SessaoTreinamentoService {

    private final SessaoTreinamentoRepository sessaoRepository;
    private final TrainingRoomRepository trainingRoomRepository;
    private final RatRepository ratRepository;
    private final AuditLogRepository auditLogRepository;

    public SessaoTreinamentoService(
            SessaoTreinamentoRepository sessaoRepository,
            TrainingRoomRepository trainingRoomRepository,
            RatRepository ratRepository,
            AuditLogRepository auditLogRepository) {
        this.sessaoRepository = sessaoRepository;
        this.trainingRoomRepository = trainingRoomRepository;
        this.ratRepository = ratRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public SessaoTreinamentoDTO criarSessao(Long trainingRoomId, String modoCaptura, User usuario) {
        TrainingRoom room = trainingRoomRepository.findById(trainingRoomId)
                .orElseThrow(() -> new RuntimeException("Sala não encontrada"));

        ModoCaptura modo = "COMPLETO".equals(modoCaptura) ? ModoCaptura.COMPLETO : ModoCaptura.SOLO;

        SessaoTreinamento sessao = new SessaoTreinamento();
        sessao.setTrainingRoom(room);
        sessao.setCriadoPor(usuario);
        sessao.setModoCaptura(modo);
        SessaoTreinamento saved = sessaoRepository.save(sessao);

        String descricao = "Sessão criada | sala=" + room.getTitle() + " | modo=" + modo.name()
                + (modo == ModoCaptura.COMPLETO ? " | consentimento=confirmado" : "");
        auditLogRepository.save(new AuditLog(
                "SESSAO", "CRIAR_SESSAO",
                "sessao#" + saved.getId(),
                usuario.getEmail(),
                descricao));

        return new SessaoTreinamentoDTO(saved, null);
    }

    @Transactional
    public SessaoTreinamentoDTO encerrarSessao(Long sessaoId, User usuario) {
        SessaoTreinamento sessao = sessaoRepository.findById(sessaoId)
                .orElseThrow(() -> new RuntimeException("Sessão não encontrada"));

        if (sessao.getStatus() == SessaoTreinamentoStatus.ENCERRADA) {
            throw new RuntimeException("Sessão já encerrada");
        }

        sessao.setStatus(SessaoTreinamentoStatus.ENCERRADA);
        sessao.setDataHoraFim(LocalDateTime.now(ZoneOffset.UTC));
        sessaoRepository.save(sessao);

        auditLogRepository.save(new AuditLog(
                "SESSAO", "ENCERRAR_SESSAO",
                "sessao#" + sessaoId,
                usuario.getEmail(),
                "Sessão encerrada"));

        Optional<Rat> rat = ratRepository.findBySessaoId(sessaoId);
        return new SessaoTreinamentoDTO(sessao, rat.orElse(null));
    }

    @Transactional(readOnly = true)
    public List<SessaoTreinamentoDTO> listarPorSala(Long trainingRoomId) {
        return sessaoRepository
                .findByTrainingRoomIdOrderByDataHoraInicioDesc(trainingRoomId)
                .stream()
                .map(s -> {
                    Rat rat = ratRepository.findBySessaoId(s.getId()).orElse(null);
                    return new SessaoTreinamentoDTO(s, rat);
                })
                .filter(dto -> !"FINALIZADO".equals(dto.getRatStatus()))
                .toList();
    }
}
