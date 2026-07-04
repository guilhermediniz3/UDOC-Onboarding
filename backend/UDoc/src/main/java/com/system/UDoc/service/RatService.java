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

        // Carrega transcrição — usada para data, duração e conteúdo
        List<TranscricaoTrecho> trechos = transcricaoRepository
                .findByTrainingRoomIdOrderByTimestampAsc(req.trainingRoomId());

        // Extrai data e duração dos timestamps da transcrição
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        String dataStr = "Não especificada";
        String duracaoStr = "Não especificada";
        if (!trechos.isEmpty()) {
            LocalDateTime inicio = trechos.get(0).getTimestamp();
            LocalDateTime fim = trechos.get(trechos.size() - 1).getTimestamp();
            dataStr = inicio.toLocalDate().format(dateFmt)
                    + " às " + inicio.toLocalTime().format(timeFmt);
            long minutos = java.time.Duration.between(inicio, fim).toMinutes();
            duracaoStr = minutos > 0 ? minutos + " minuto(s)" : "menos de 1 minuto";
        } else {
            // Fallback: usa a primeira sessão agendada se não houver transcrição
            List<TrainingSession> sessions = trainingSessionRepository
                    .findByTrainingRoomIdOrderByDayNumberAsc(req.trainingRoomId());
            if (!sessions.isEmpty()) {
                dataStr = sessions.get(0).getDate().format(dateFmt);
            }
        }

        // ── Seção 1 gerada pelo Java — formatação garantida, sem depender da IA ──
        String secao1 = "<h2>1. Identificação do Atendimento</h2>\n"
                + "<p><strong>Empresa/Cliente:</strong></p>\n"
                + "<p>" + (room.getCompany() != null ? room.getCompany().getName() : "Não especificada") + "</p>\n"
                + "<p><strong>ISM/Analista Responsável:</strong></p>\n"
                + "<p>" + (room.getIsm() != null ? room.getIsm().getName() : "Não especificado") + "</p>\n"
                + "<p><strong>Data:</strong></p>\n"
                + "<p>" + dataStr + "</p>\n"
                + "<p><strong>Duração estimada do atendimento:</strong></p>\n"
                + "<p>" + duracaoStr + "</p>\n";

        // ── Contexto enviado à IA para as seções 2–8 ──
        StringBuilder ctx = new StringBuilder();
        ctx.append("=== INFORMAÇÕES DA SALA ===\n");
        ctx.append("Título: ").append(room.getTitle()).append("\n");
        if (room.getDescription() != null && !room.getDescription().isBlank()) {
            ctx.append("Descrição: ").append(room.getDescription()).append("\n");
        }
        if (room.getCompany() != null) ctx.append("Empresa: ").append(room.getCompany().getName()).append("\n");
        if (room.getIsm() != null)     ctx.append("ISM: ").append(room.getIsm().getName()).append("\n");
        if (room.getTrail() != null)   ctx.append("Trilha: ").append(room.getTrail().getName()).append("\n");
        if (!room.getInvitedEmployees().isEmpty()) {
            ctx.append("Convidados: ").append(
                    room.getInvitedEmployees().stream().map(Employee::getName).collect(Collectors.joining(", "))
            ).append("\n");
        }
        ctx.append("ISM presente: ").append(autor.getName()).append("\n");
        ctx.append("Data da sessão: ").append(dataStr).append("\n");

        String transcricaoTexto = trechos.stream()
                .map(t -> "[" + t.getTimestamp().toLocalTime().toString().substring(0, 8) + "] " + t.getTexto())
                .collect(Collectors.joining("\n"));
        if (transcricaoTexto.isBlank()) {
            transcricaoTexto = "(Nenhuma transcrição disponível)";
        }
        ctx.append("\n=== TRANSCRIÇÃO DA SESSÃO ===\n").append(transcricaoTexto);

        String systemPrompt = """
                Você é um especialista em documentação de atendimento técnico corporativo (Customer Success / ISM).
                Com base na transcrição e contexto fornecidos, gere as seções 2 a 8 de um RAT em HTML semântico.
                Use somente as tags: <h2>, <p>, <ul>, <li>, <strong>.
                Linguagem formal e objetiva. NÃO gere a seção 1 — ela já foi produzida pelo sistema.

                REGRA DE FORMATAÇÃO — aplique em todos os campos com rótulo:
                <p><strong>Rótulo:</strong></p>
                <p>Valor do campo na linha seguinte</p>

                Seções a gerar:

                <h2>2. Participantes</h2>
                <ul><li>Nome — papel (cliente, ISM, equipe interna)</li></ul>

                <h2>3. Objetivo do Atendimento</h2>
                <p><strong>Propósito da sessão:</strong></p>
                <p>Treinamento, implantação, suporte, acompanhamento etc.</p>

                <h2>4. Tópicos Abordados</h2>
                <ul><li>Cada tópico técnico ou funcional discutido</li></ul>

                <h2>5. Dúvidas Levantadas</h2>
                <ul><li>Dúvidas levantadas pelo cliente</li></ul>

                <h2>6. Pendências</h2>
                <ul><li>Itens em aberto ou aguardando retorno</li></ul>

                <h2>7. Próximos Passos</h2>
                <ul><li>Ação — Responsável — Prazo estimado</li></ul>

                <h2>8. Observações Técnicas</h2>
                <p>Informações complementares para o time de CS/ISM</p>

                Responda APENAS com o HTML das seções 2 a 8, sem bloco de código, sem DOCTYPE, sem explicações.
                """;

        auditLogRepository.save(new AuditLog(
                "RAT", "GERAR_RAT",
                "training-room#" + req.trainingRoomId(),
                autor.getEmail(),
                "RAT gerado via IA"));

        String secoes2a8 = aiService.generate(systemPrompt, ctx.toString()).content();
        return secao1 + secoes2a8;
    }
}
