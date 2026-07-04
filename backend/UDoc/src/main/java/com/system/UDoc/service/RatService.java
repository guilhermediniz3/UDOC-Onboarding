package com.system.UDoc.service;

import com.system.UDoc.dto.GerarRatRequestDTO;
import com.system.UDoc.dto.RatDTO;
import com.system.UDoc.dto.RatRequestDTO;
import com.system.UDoc.entity.*;
import com.system.UDoc.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
public class RatService {

    private final RatRepository ratRepository;
    private final TranscricaoTrechoRepository transcricaoRepository;
    private final TrainingRoomRepository trainingRoomRepository;
    private final CompanyRepository companyRepository;
    private final IsmRepository ismRepository;
    private final AuditLogRepository auditLogRepository;
    private final AIService aiService;

    public RatService(
            RatRepository ratRepository,
            TranscricaoTrechoRepository transcricaoRepository,
            TrainingRoomRepository trainingRoomRepository,
            CompanyRepository companyRepository,
            IsmRepository ismRepository,
            AuditLogRepository auditLogRepository,
            AIService aiService) {
        this.ratRepository = ratRepository;
        this.transcricaoRepository = transcricaoRepository;
        this.trainingRoomRepository = trainingRoomRepository;
        this.companyRepository = companyRepository;
        this.ismRepository = ismRepository;
        this.auditLogRepository = auditLogRepository;
        this.aiService = aiService;
    }

    @Transactional(readOnly = true)
    public Page<RatDTO> listar(
            Long ismId,
            Long companyId,
            Long autorId,
            LocalDate dataInicio,
            LocalDate dataFim,
            Pageable pageable) {
        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay() : null;
        LocalDateTime fim = dataFim != null ? dataFim.atTime(23, 59, 59) : null;
        return ratRepository.findWithFilters(ismId, companyId, autorId, inicio, fim, pageable)
                .map(RatDTO::new);
    }

    @Transactional
    public RatDTO salvar(RatRequestDTO req, User autor) {
        TrainingRoom room = trainingRoomRepository.findById(req.getTrainingRoomId())
                .orElseThrow(() -> new RuntimeException("Sala não encontrada"));

        Rat rat = new Rat();
        rat.setTrainingRoom(room);
        rat.setTitulo(req.getTitulo());
        rat.setConteudo(req.getConteudo());
        rat.setAutor(autor);

        if (req.getCompanyId() != null) {
            companyRepository.findById(req.getCompanyId()).ifPresent(rat::setCompany);
        }
        if (req.getIsmId() != null) {
            ismRepository.findById(req.getIsmId()).ifPresent(rat::setIsm);
        }

        Rat saved = ratRepository.save(rat);

        auditLogRepository.save(new AuditLog(
                "RAT", "SALVAR_RAT",
                "training-room#" + req.getTrainingRoomId(),
                autor.getEmail(),
                "RAT salvo: " + req.getTitulo()));

        return new RatDTO(saved);
    }

    @Transactional
    public RatDTO atualizar(Long id, RatRequestDTO req, User autor) {
        Rat rat = ratRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RAT não encontrado"));

        rat.setTitulo(req.getTitulo());
        rat.setConteudo(req.getConteudo());

        if (req.getCompanyId() != null) {
            companyRepository.findById(req.getCompanyId()).ifPresent(rat::setCompany);
        }
        if (req.getIsmId() != null) {
            ismRepository.findById(req.getIsmId()).ifPresent(rat::setIsm);
        }

        return new RatDTO(ratRepository.save(rat));
    }

    @Transactional
    public void deletar(Long id, User autor) {
        ratRepository.deleteById(id);
        auditLogRepository.save(new AuditLog(
                "RAT", "DELETAR_RAT",
                "rat#" + id,
                autor.getEmail(),
                "RAT excluído"));
    }

    @Transactional(readOnly = true)
    public RatDTO buscarPorId(Long id) {
        return ratRepository.findById(id)
                .map(RatDTO::new)
                .orElseThrow(() -> new RuntimeException("RAT não encontrado"));
    }

    @Transactional
    public String gerarComIA(GerarRatRequestDTO req, User autor) {
        String transcricaoTexto = transcricaoRepository
                .findByTrainingRoomIdOrderByTimestampAsc(req.trainingRoomId())
                .stream()
                .map(t -> "[" + t.getTimestamp().toLocalTime().toString().substring(0, 8) + "] " + t.getTexto())
                .collect(Collectors.joining("\n"));

        if (transcricaoTexto.isBlank()) {
            transcricaoTexto = "(Nenhuma transcrição disponível para esta sala)";
        }

        String systemPrompt = """
                Você é um assistente especializado em documentação corporativa brasileira.
                Gere um Relatório de Atendimento Técnico (RAT) completo em HTML semântico,
                usando apenas as tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>.
                O RAT deve conter obrigatoriamente estas seções:
                1. Cabeçalho (Empresa/Cliente, ISM/Responsável, Data, Duração estimada)
                2. Participantes
                3. Objetivo do Atendimento
                4. Tópicos Abordados
                5. Dúvidas Levantadas
                6. Pendências
                7. Próximos Passos
                8. Observações
                Responda APENAS com o HTML das seções, sem bloco de código, sem DOCTYPE, sem head, sem body.
                """;

        String userPrompt = "Transcrição da sessão de treinamento:\n\n" + transcricaoTexto;

        auditLogRepository.save(new AuditLog(
                "RAT", "GERAR_RAT",
                "training-room#" + req.trainingRoomId(),
                autor.getEmail(),
                "RAT gerado via IA"));

        return aiService.generate(systemPrompt, userPrompt).content();
    }
}
