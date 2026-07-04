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
                Você é um especialista em documentação de atendimento técnico corporativo (Customer Success / ISM).
                Com base na transcrição fornecida, gere um Relatório de Atendimento Técnico (RAT) profissional em HTML semântico.
                Use somente as tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>.
                Linguagem formal, objetiva e voltada ao universo de CS/suporte técnico.

                Estrutura obrigatória:

                <h2>1. Identificação do Atendimento</h2>
                <p>Empresa/Cliente, ISM/Analista Responsável, Data, Duração estimada do atendimento</p>

                <h2>2. Participantes</h2>
                <p>Lista de participantes identificados e seus papéis (cliente, ISM, equipe interna)</p>

                <h2>3. Objetivo do Atendimento</h2>
                <p>Propósito da sessão (treinamento, implantação, suporte, acompanhamento etc.)</p>

                <h2>4. Tópicos Abordados</h2>
                <ul><li>Cada tópico técnico ou funcional discutido na sessão</li></ul>

                <h2>5. Dúvidas Levantadas</h2>
                <ul><li>Dúvidas, questionamentos ou pontos levantados pelo cliente</li></ul>

                <h2>6. Pendências</h2>
                <ul><li>Itens em aberto, problemas não resolvidos ou aguardando retorno</li></ul>

                <h2>7. Próximos Passos</h2>
                <ul><li>Ações acordadas com responsável e prazo estimado</li></ul>

                <h2>8. Observações Técnicas</h2>
                <p>Informações complementares relevantes para o time de CS/ISM</p>

                Responda APENAS com o HTML das seções, sem bloco de código, sem DOCTYPE, sem explicações extras.
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
