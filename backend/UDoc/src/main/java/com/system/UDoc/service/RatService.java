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
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RatService {

    private final RatRepository ratRepository;
    private final TranscricaoTrechoRepository transcricaoRepository;
    private final TrainingRoomRepository trainingRoomRepository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final CompanyRepository companyRepository;
    private final IsmRepository ismRepository;
    private final AuditLogRepository auditLogRepository;
    private final AIService aiService;

    public RatService(
            RatRepository ratRepository,
            TranscricaoTrechoRepository transcricaoRepository,
            TrainingRoomRepository trainingRoomRepository,
            TrainingSessionRepository trainingSessionRepository,
            CompanyRepository companyRepository,
            IsmRepository ismRepository,
            AuditLogRepository auditLogRepository,
            AIService aiService) {
        this.ratRepository = ratRepository;
        this.transcricaoRepository = transcricaoRepository;
        this.trainingRoomRepository = trainingRoomRepository;
        this.trainingSessionRepository = trainingSessionRepository;
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
        return ratRepository.findByIdWithRelations(id)
                .map(RatDTO::new)
                .orElseThrow(() -> new RuntimeException("RAT não encontrado"));
    }

    @Transactional
    public String gerarComIA(GerarRatRequestDTO req, User autor) {
        TrainingRoom room = trainingRoomRepository.findByIdWithContext(req.trainingRoomId())
                .orElseThrow(() -> new RuntimeException("Sala não encontrada"));

        List<TrainingSession> sessions = trainingSessionRepository
                .findByTrainingRoomIdOrderByDayNumberAsc(req.trainingRoomId());

        // Monta bloco de contexto com dados reais da sala
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        StringBuilder ctx = new StringBuilder();
        ctx.append("=== INFORMAÇÕES DA SALA DE TREINAMENTO ===\n");
        ctx.append("Título da sala: ").append(room.getTitle()).append("\n");

        if (room.getDescription() != null && !room.getDescription().isBlank()) {
            ctx.append("Descrição: ").append(room.getDescription()).append("\n");
        }
        if (room.getCompany() != null) {
            ctx.append("Empresa/Cliente: ").append(room.getCompany().getName()).append("\n");
        }
        if (room.getIsm() != null) {
            ctx.append("ISM/Analista Responsável: ").append(room.getIsm().getName()).append("\n");
        }
        if (room.getTrail() != null) {
            ctx.append("Trilha vinculada: ").append(room.getTrail().getName()).append("\n");
        }
        if (!room.getInvitedEmployees().isEmpty()) {
            String participantes = room.getInvitedEmployees().stream()
                    .map(Employee::getName)
                    .collect(Collectors.joining(", "));
            ctx.append("Participantes (funcionários convidados): ").append(participantes).append("\n");
        }
        ctx.append("ISM presente na sessão: ").append(autor.getName()).append("\n");

        if (!sessions.isEmpty()) {
            ctx.append("\nDias de treinamento:\n");
            for (TrainingSession s : sessions) {
                ctx.append("  Dia ").append(s.getDayNumber())
                        .append(": ").append(s.getDate().format(dateFmt))
                        .append(" das ").append(s.getStartTime().format(timeFmt))
                        .append(" às ").append(s.getEndTime().format(timeFmt))
                        .append("\n");
            }
        }

        ctx.append("\n=== TRANSCRIÇÃO DA SESSÃO ===\n");

        String transcricaoTexto = transcricaoRepository
                .findByTrainingRoomIdOrderByTimestampAsc(req.trainingRoomId())
                .stream()
                .map(t -> "[" + t.getTimestamp().toLocalTime().toString().substring(0, 8) + "] " + t.getTexto())
                .collect(Collectors.joining("\n"));

        if (transcricaoTexto.isBlank()) {
            transcricaoTexto = "(Nenhuma transcrição disponível para esta sala)";
        }

        String userPrompt = ctx.toString() + transcricaoTexto;

        String systemPrompt = """
                Você é um especialista em documentação de atendimento técnico corporativo (Customer Success / ISM).
                Com base nas informações e transcrição fornecidas, gere um Relatório de Atendimento Técnico (RAT) profissional em HTML semântico.
                Use somente as tags: <h2>, <p>, <ul>, <li>, <strong>.
                Linguagem formal, objetiva e voltada ao universo de CS/suporte técnico.

                REGRA DE FORMATAÇÃO OBRIGATÓRIA — aplique em TODOS os campos:
                Cada rótulo deve estar em um <p><strong>Rótulo:</strong></p> próprio,
                e o valor correspondente em um <p> separado logo abaixo. NUNCA coloque
                rótulo e valor na mesma linha.

                Exemplo correto:
                <p><strong>Empresa/Cliente:</strong></p>
                <p>Nome da empresa</p>

                Estrutura obrigatória:

                <h2>1. Identificação do Atendimento</h2>
                <p><strong>Empresa/Cliente:</strong></p><p>...</p>
                <p><strong>ISM/Analista Responsável:</strong></p><p>...</p>
                <p><strong>Data:</strong></p><p>...</p>
                <p><strong>Duração estimada do atendimento:</strong></p><p>...</p>

                <h2>2. Participantes</h2>
                <p><strong>Participantes identificados:</strong></p>
                <ul><li>Nome — papel (cliente, ISM, equipe interna)</li></ul>

                <h2>3. Objetivo do Atendimento</h2>
                <p><strong>Propósito da sessão:</strong></p>
                <p>Treinamento, implantação, suporte, acompanhamento etc.</p>

                <h2>4. Tópicos Abordados</h2>
                <ul><li>Cada tópico técnico ou funcional discutido</li></ul>

                <h2>5. Dúvidas Levantadas</h2>
                <ul><li>Dúvidas e questionamentos levantados pelo cliente</li></ul>

                <h2>6. Pendências</h2>
                <ul><li>Itens em aberto ou aguardando retorno</li></ul>

                <h2>7. Próximos Passos</h2>
                <ul><li>Ação — Responsável — Prazo estimado</li></ul>

                <h2>8. Observações Técnicas</h2>
                <p>Informações complementares relevantes para o time de CS/ISM</p>

                Responda APENAS com o HTML das seções, sem bloco de código, sem DOCTYPE, sem explicações extras.
                """;

        auditLogRepository.save(new AuditLog(
                "RAT", "GERAR_RAT",
                "training-room#" + req.trainingRoomId(),
                autor.getEmail(),
                "RAT gerado via IA"));

        return aiService.generate(systemPrompt, userPrompt).content();
    }
}
