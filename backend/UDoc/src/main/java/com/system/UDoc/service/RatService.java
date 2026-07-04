package com.system.UDoc.service;

import com.system.UDoc.dto.GerarRatRequestDTO;
import com.system.UDoc.dto.RatDTO;
import com.system.UDoc.dto.RatReopenRequestDTO;
import com.system.UDoc.dto.RatRequestDTO;
import com.system.UDoc.entity.*;
import com.system.UDoc.repository.*;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RatService {

    private final RatRepository ratRepository;
    private final TranscricaoTrechoRepository transcricaoRepository;
    private final TrainingRoomRepository trainingRoomRepository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final SessaoTreinamentoRepository sessaoTreinamentoRepository;
    private final CompanyRepository companyRepository;
    private final IsmRepository ismRepository;
    private final AuditLogRepository auditLogRepository;
    private final AIService aiService;

    public RatService(
            RatRepository ratRepository,
            TranscricaoTrechoRepository transcricaoRepository,
            TrainingRoomRepository trainingRoomRepository,
            TrainingSessionRepository trainingSessionRepository,
            SessaoTreinamentoRepository sessaoTreinamentoRepository,
            CompanyRepository companyRepository,
            IsmRepository ismRepository,
            AuditLogRepository auditLogRepository,
            AIService aiService) {
        this.ratRepository = ratRepository;
        this.transcricaoRepository = transcricaoRepository;
        this.trainingRoomRepository = trainingRoomRepository;
        this.trainingSessionRepository = trainingSessionRepository;
        this.sessaoTreinamentoRepository = sessaoTreinamentoRepository;
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
            String status,
            int timezoneOffset,
            Pageable pageable) {

        java.time.ZoneOffset clientOffset = java.time.ZoneOffset.ofTotalSeconds(-timezoneOffset * 60);
        LocalDateTime inicio = dataInicio != null
                ? dataInicio.atStartOfDay().atOffset(clientOffset)
                        .withOffsetSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime()
                : null;
        LocalDateTime fim = dataFim != null
                ? dataFim.atTime(23, 59, 59).atOffset(clientOffset)
                        .withOffsetSameInstant(java.time.ZoneOffset.UTC).toLocalDateTime()
                : null;

        Specification<Rat> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (ismId     != null) predicates.add(cb.equal(root.get("ism").get("id"),     ismId));
            if (companyId != null) predicates.add(cb.equal(root.get("company").get("id"), companyId));
            if (autorId   != null) predicates.add(cb.equal(root.get("autor").get("id"),   autorId));
            if (inicio    != null) predicates.add(cb.greaterThanOrEqualTo(root.get("dataCriacao"), inicio));
            if (fim       != null) predicates.add(cb.lessThanOrEqualTo(root.get("dataCriacao"),    fim));
            if (status    != null && !status.isBlank()) {
                try {
                    RatStatus rs = RatStatus.valueOf(status);
                    predicates.add(cb.equal(root.get("status"), rs));
                } catch (IllegalArgumentException ignored) {}
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable orderedPage = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "dataCriacao"));

        return ratRepository.findAll(spec, orderedPage).map(RatDTO::new);
    }

    @Transactional
    public RatDTO salvar(RatRequestDTO req, User autor) {
        TrainingRoom room;
        SessaoTreinamento sessao = null;

        if (req.getSessaoId() != null) {
            sessao = sessaoTreinamentoRepository.findById(req.getSessaoId())
                    .orElseThrow(() -> new RuntimeException("Sessão não encontrada"));
            room = sessao.getTrainingRoom();
        } else {
            room = trainingRoomRepository.findById(req.getTrainingRoomId())
                    .orElseThrow(() -> new RuntimeException("Sala não encontrada"));
        }

        Rat rat = new Rat();
        rat.setTrainingRoom(room);
        rat.setSessao(sessao);
        rat.setTitulo(req.getTitulo());
        rat.setConteudo(req.getConteudo());
        rat.setAutor(autor);
        rat.setStatus(RatStatus.RASCUNHO);

        if (req.getCompanyId() != null) {
            companyRepository.findById(req.getCompanyId()).ifPresent(rat::setCompany);
        } else if (room.getCompany() != null) {
            rat.setCompany(room.getCompany());
        }
        if (req.getIsmId() != null) {
            ismRepository.findById(req.getIsmId()).ifPresent(rat::setIsm);
        } else if (room.getIsm() != null) {
            rat.setIsm(room.getIsm());
        }

        Rat saved = ratRepository.save(rat);

        auditLogRepository.save(new AuditLog(
                "RAT", "SALVAR_RASCUNHO",
                "rat#" + saved.getId(),
                autor.getEmail(),
                "Rascunho de RAT criado: " + req.getTitulo()));

        return new RatDTO(saved);
    }

    @Transactional
    public RatDTO atualizar(Long id, RatRequestDTO req, User autor) {
        Rat rat = ratRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RAT não encontrado"));

        if (rat.getStatus() == RatStatus.FINALIZADO) {
            throw new RuntimeException("RAT finalizado não pode ser editado. Use 'Reabrir' primeiro.");
        }

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
    public RatDTO finalizar(Long id, User autor) {
        Rat rat = ratRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RAT não encontrado"));

        rat.setStatus(RatStatus.FINALIZADO);
        Rat saved = ratRepository.save(rat);

        auditLogRepository.save(new AuditLog(
                "RAT", "FINALIZAR_RAT",
                "rat#" + id,
                autor.getEmail(),
                "RAT finalizado: " + rat.getTitulo()));

        return new RatDTO(saved);
    }

    @Transactional
    public RatDTO reabrir(Long id, RatReopenRequestDTO req, User autor) {
        if (req.motivo() == null || req.motivo().trim().length() < 10) {
            throw new RuntimeException("Motivo de reabertura deve ter pelo menos 10 caracteres.");
        }

        Rat rat = ratRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RAT não encontrado"));

        if (rat.getStatus() != RatStatus.FINALIZADO) {
            throw new RuntimeException("Apenas RATs finalizados podem ser reabertos.");
        }

        String snapshot = "TITULO=" + rat.getTitulo()
                + " | CONTEUDO_LEN=" + (rat.getConteudo() != null ? rat.getConteudo().length() : 0)
                + " | MOTIVO=" + req.motivo().trim();

        rat.setStatus(RatStatus.RASCUNHO);
        Rat saved = ratRepository.save(rat);

        auditLogRepository.save(new AuditLog(
                "RAT", "REABRIR_RAT",
                "rat#" + id,
                autor.getEmail(),
                snapshot));

        return new RatDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<RatDTO> listarLegadoPorSala(Long trainingRoomId) {
        return ratRepository
                .findByTrainingRoomIdAndSessaoIsNullOrderByDataCriacaoDesc(trainingRoomId)
                .stream()
                .map(RatDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public RatDTO buscarPorId(Long id) {
        return ratRepository.findByIdWithRelations(id)
                .map(RatDTO::new)
                .orElseThrow(() -> new RuntimeException("RAT não encontrado"));
    }

    @Transactional
    public String gerarComIA(GerarRatRequestDTO req, User autor) {
        SessaoTreinamento sessao = sessaoTreinamentoRepository.findById(req.sessaoId())
                .orElseThrow(() -> new RuntimeException("Sessão não encontrada"));

        TrainingRoom room = trainingRoomRepository.findByIdWithContext(sessao.getTrainingRoom().getId())
                .orElseThrow(() -> new RuntimeException("Sala não encontrada"));

        List<TranscricaoTrecho> trechos = transcricaoRepository
                .findBySessaoIdOrderByTimestampAsc(req.sessaoId());

        if (trechos.isEmpty()) {
            throw new RuntimeException("Sessão sem conteúdo transcrito. Inicie a transcrição na aba Treinamento antes de gerar o RAT.");
        }

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

        int offsetMinutes = req.timezoneOffset() != null ? req.timezoneOffset() : 180;
        java.time.ZoneOffset clientOffset = java.time.ZoneOffset.ofTotalSeconds(-offsetMinutes * 60);
        LocalDateTime inicio = trechos.get(0).getTimestamp()
                .atZone(java.time.ZoneOffset.UTC).withZoneSameInstant(clientOffset).toLocalDateTime();
        LocalDateTime fim    = trechos.get(trechos.size() - 1).getTimestamp()
                .atZone(java.time.ZoneOffset.UTC).withZoneSameInstant(clientOffset).toLocalDateTime();

        String dataStr    = inicio.toLocalDate().format(dateFmt);
        String horarioStr = inicio.toLocalTime().format(timeFmt) + " às " + fim.toLocalTime().format(timeFmt);

        long totalMin = java.time.Duration.between(inicio, fim).toMinutes();
        String duracaoStr;
        if (totalMin >= 60) {
            duracaoStr = (totalMin / 60) + "h" + (totalMin % 60 > 0 ? " " + (totalMin % 60) + "min" : "");
        } else if (totalMin > 0) {
            duracaoStr = totalMin + " min";
        } else {
            duracaoStr = "menos de 1 min";
        }

        String empresaNome = room.getCompany() != null ? room.getCompany().getName() : "Não especificada";
        String ismNome     = room.getIsm()     != null ? room.getIsm().getName()     : "Não especificado";
        String trilhaNome  = room.getTrail()   != null ? room.getTrail().getName()   : "não vinculada";

        String secao1 = "<h2>1. Identificação do Atendimento</h2>\n"
                + "<ul>\n"
                + "<li><strong>Empresa/Cliente:</strong> " + empresaNome + "</li>\n"
                + "<li><strong>ISM/Analista Responsável:</strong> " + ismNome + "</li>\n"
                + "<li><strong>Data:</strong> " + dataStr + "</li>\n"
                + "<li><strong>Horário:</strong> " + horarioStr + "</li>\n"
                + "<li><strong>Duração:</strong> " + duracaoStr + "</li>\n"
                + "<li><strong>Sala/Treinamento:</strong> " + room.getTitle() + "</li>\n"
                + "</ul>\n";

        StringBuilder participantesHtml = new StringBuilder("<h2>2. Participantes</h2>\n<ul>\n");
        for (Employee e : room.getInvitedEmployees()) {
            participantesHtml.append("<li>").append(e.getName()).append(" — funcionário convidado</li>\n");
        }
        if (room.getIsm() != null) {
            participantesHtml.append("<li>").append(ismNome).append(" — ISM/Analista Responsável</li>\n");
        }
        participantesHtml.append("<li>").append(autor.getName()).append(" — ISM presente na sessão</li>\n");
        participantesHtml.append("</ul>\n");

        StringBuilder metadados = new StringBuilder("METADADOS DA SESSÃO:\n");
        metadados.append("- Empresa/Cliente: ").append(empresaNome).append("\n");
        metadados.append("- ISM/Analista Responsável: ").append(ismNome).append("\n");
        metadados.append("- Data: ").append(dataStr).append("\n");
        metadados.append("- Horário: ").append(horarioStr).append("\n");
        metadados.append("- Duração: ").append(duracaoStr).append("\n");
        metadados.append("- Sala/Treinamento: ").append(room.getTitle()).append("\n");
        metadados.append("- Trilha vinculada: ").append(trilhaNome).append("\n");
        metadados.append("- Participantes:\n");
        for (Employee e : room.getInvitedEmployees()) {
            metadados.append("  * ").append(e.getName()).append(" — funcionário convidado\n");
        }
        if (room.getIsm() != null) {
            metadados.append("  * ").append(ismNome).append(" — ISM/Analista Responsável\n");
        }
        metadados.append("  * ").append(autor.getName()).append(" — ISM presente na sessão\n");

        String transcricaoTexto = trechos.stream()
                .map(t -> "[" + t.getTimestamp().toLocalTime().format(timeFmt) + "] " + t.getTexto())
                .collect(Collectors.joining("\n"));

        String userMessage = metadados + "\nTRANSCRIÇÃO DA SESSÃO:\n" + transcricaoTexto;

        System.out.println("[RAT-IA] sessao=" + req.sessaoId()
                + " | empresa=" + empresaNome + " | ism=" + ismNome
                + " | data=" + dataStr + " | duracao=" + duracaoStr
                + " | trechos=" + trechos.size());

        String systemPrompt = """
                Você é um assistente especializado em documentação de atendimentos técnicos. Sua tarefa é transformar a transcrição de uma sessão de treinamento em um RAT (Relatório de Atendimento Técnico) profissional, seguindo EXATAMENTE as regras abaixo.

                REGRAS OBRIGATÓRIAS:
                1. Os dados de identificação (empresa, responsável, data, duração, participantes) serão fornecidos nos METADADOS. Use-os exatamente como recebidos. NUNCA tente extraí-los ou deduzi-los da transcrição.
                2. A seção "Resumo do Atendimento" é OBRIGATÓRIA e nunca pode ficar vazia: escreva 1 a 3 parágrafos narrando, em linguagem profissional e objetiva, o que foi o atendimento — o que foi ensinado, demonstrado ou discutido, com base no conteúdo real da conversa.
                3. Nas seções "Dúvidas Levantadas", "Pendências" e "Próximos Passos": inclua APENAS itens com evidência explícita na transcrição. Se não houver evidência, escreva exatamente: <p>Nenhum item identificado nesta sessão.</p>
                4. Considere como evidência de dúvida: perguntas feitas ou ecoadas pelo instrutor. Como evidência de pendência: itens verbalizados como em aberto. Como evidência de próximo passo: compromissos verbalizados.
                5. Em "Tópicos Abordados", liste os assuntos efetivamente tratados na conversa, em itens curtos e objetivos.
                6. Corrija erros óbvios de transcrição automática (palavras trocadas pela fonética) quando o contexto deixar claro o termo correto.
                7. Não inclua opiniões, avaliações de desempenho ou informações externas à transcrição.
                8. Escreva em português brasileiro profissional.

                FORMATO DE SAÍDA — use somente as tags HTML: <h2>, <h3>, <p>, <ul>, <li>, <strong>.
                NÃO gere as seções 1 (Identificação) e 2 (Participantes) — elas já foram produzidas pelo sistema.
                Gere APENAS as seções 3 a 9, começando diretamente com <h2>3. Objetivo do Atendimento</h2>.
                Responda APENAS com o HTML, sem bloco de código, sem DOCTYPE, sem preâmbulo.

                ESTRUTURA A GERAR:

                <h2>3. Objetivo do Atendimento</h2>
                (usar trilha/treinamento vinculado do metadado; se ausente, derivar do conteúdo)

                <h2>4. Resumo do Atendimento</h2>
                (obrigatório — narrativa do que foi a sessão com base na conversa)

                <h2>5. Tópicos Abordados</h2>
                <ul><li>apenas com evidência na transcrição</li></ul>

                <h2>6. Dúvidas Levantadas</h2>
                <ul><li>apenas com evidência; senão <p>Nenhum item identificado nesta sessão.</p></li></ul>

                <h2>7. Pendências</h2>
                <ul><li>apenas com evidência; senão <p>Nenhum item identificado nesta sessão.</p></li></ul>

                <h2>8. Próximos Passos</h2>
                <ul><li>apenas com evidência; senão <p>Nenhum item identificado nesta sessão.</p></li></ul>

                <h2>9. Observações</h2>
                (apenas se houver algo relevante que não coube acima; senão <p>Sem observações adicionais.</p>)
                """;

        auditLogRepository.save(new AuditLog(
                "RAT", "GERAR_RAT_IA",
                "sessao#" + req.sessaoId(),
                autor.getEmail(),
                "RAT gerado via IA | empresa=" + empresaNome + " | trechos=" + trechos.size()));

        String secoes3a9 = aiService.generate(systemPrompt, userMessage).content();
        return secao1 + participantesHtml + secoes3a9;
    }
}
