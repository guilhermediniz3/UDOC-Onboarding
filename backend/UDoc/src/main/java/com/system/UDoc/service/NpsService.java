package com.system.UDoc.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.system.UDoc.dto.*;
import com.system.UDoc.entity.*;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class NpsService {

    private final NpsQuestionRepository questionRepo;
    private final NpsResponseRepository responseRepo;
    private final CardRepository cardRepository;
    private final NpsConfigRepository configRepo;
    private final AIService aiService;
    private final TrailRepository trailRepository;
    private final TrailContentRepository trailContentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NpsService(NpsQuestionRepository questionRepo,
                      NpsResponseRepository responseRepo,
                      CardRepository cardRepository,
                      NpsConfigRepository configRepo,
                      AIService aiService,
                      TrailRepository trailRepository,
                      TrailContentRepository trailContentRepository) {
        this.questionRepo = questionRepo;
        this.responseRepo = responseRepo;
        this.cardRepository = cardRepository;
        this.configRepo = configRepo;
        this.aiService = aiService;
        this.trailRepository = trailRepository;
        this.trailContentRepository = trailContentRepository;
    }

    @Transactional(readOnly = true)
    public List<NpsQuestionDTO> getQuestions(String refType, Long refId) {
        return questionRepo.findByReferenceTypeAndReferenceIdOrderByOrdemAsc(refType, refId)
                .stream().map(NpsQuestionDTO::new).toList();
    }

    @Transactional
    public List<NpsQuestionDTO> replaceQuestions(String refType, Long refId,
                                                 List<NpsQuestionRequestDTO> requests) {
        questionRepo.deleteByReference(refType, refId);
        List<NpsQuestion> saved = new ArrayList<>();
        int i = 0;
        for (NpsQuestionRequestDTO req : requests) {
            NpsQuestion q = new NpsQuestion();
            q.setReferenceType(refType); q.setReferenceId(refId);
            q.setEnunciado(req.getEnunciado()); q.setTipo(req.getTipo());
            q.setOrdem(req.getOrdem() != null ? req.getOrdem() : i++);
            saved.add(questionRepo.save(q));
        }
        return saved.stream().map(NpsQuestionDTO::new).toList();
    }

    @Transactional
    public void submitResponse(NpsResponseRequestDTO req) {
        NpsQuestion question = questionRepo.findById(req.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("NPS question not found"));
        NpsResponse r = new NpsResponse();
        r.setQuestion(question);
        r.setScore(req.getScore());
        r.setResposta(req.getResposta());
        responseRepo.save(r);
    }

    /** Gera 2-3 perguntas NPS para card ou trilha usando o Groq */
    @Transactional(readOnly = true)
    public List<NpsQuestionDTO> generateNpsQuestionsWithGroq(String refType, Long refId) {
        StringBuilder context = new StringBuilder();

        if ("card".equals(refType)) {
            cardRepository.findById(refId).ifPresent(card -> {
                context.append("### ").append(card.getTitle()).append("\n");
                if (card.getDescription() != null && !card.getDescription().isBlank())
                    context.append(card.getDescription()).append("\n");
                if (card.getContent() != null && !card.getContent().isBlank())
                    context.append(card.getContent().replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim()).append("\n");
            });
        } else {
            // trail — lê conteúdo de todos os cards da trilha
            List<com.system.UDoc.entity.TrailContent> contents =
                    trailContentRepository.findByTrailIdOrderByOrdemAsc(refId);
            for (com.system.UDoc.entity.TrailContent tc : contents) {
                if ("card".equals(tc.getTipo())) {
                    cardRepository.findById(tc.getReferenciaId()).ifPresent(card -> {
                        context.append("### ").append(card.getTitle()).append("\n");
                        if (card.getDescription() != null && !card.getDescription().isBlank())
                            context.append(card.getDescription()).append("\n");
                        if (card.getContent() != null && !card.getContent().isBlank())
                            context.append(card.getContent().replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim()).append("\n\n");
                    });
                }
            }
            // fallback: cards via ManyToMany antigo
            if (context.length() == 0) {
                trailRepository.findById(refId).ifPresent(trail ->
                    trail.getCards().forEach(card -> {
                        context.append("### ").append(card.getTitle()).append("\n");
                        if (card.getDescription() != null) context.append(card.getDescription()).append("\n");
                    })
                );
            }
        }

        if (context.length() < 10)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Sem conteudo suficiente para gerar perguntas NPS.");

        String tipoNome = "card".equals(refType) ? "documento" : "trilha de treinamento";
        String prompt = """
            Com base no seguinte conteudo educacional, gere 2 perguntas de pesquisa de satisfacao NPS
            em portugues brasileiro para avaliar a experiencia de aprendizado (nao teste de conhecimento).
            Retorne APENAS um JSON array valido, sem texto adicional, sem markdown:
            [{"enunciado":"string","tipo":"faces|text"}]
            Regras:
            - Gere exatamente 2 perguntas
            - A primeira deve ser do tipo "faces" (satisfacao geral, 1=insatisfeito a 4=muito satisfeito)
            - A segunda deve ser do tipo "text" (sugestao ou comentario livre)
            - As perguntas devem se referir a experiencia com este """ + tipoNome + """

            Exemplos faces: "Como voce avalia este conteudo?", "Qual seu nivel de satisfacao com este treinamento?"
            Exemplos text: "O que mais gostou?", "Tem sugestoes de melhoria para este conteudo?"
            Conteudo:
            """ + context;

        // Chama o provedor de IA com proteção contra erros HTTP (evita logout no frontend)
        AIResponseDTO resp;
        try {
            resp = aiService.generate(prompt);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            int st = e.getStatusCode().value();
            System.err.println("[IA/NPS] HTTP " + st + ": " + e.getResponseBodyAsString());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Erro " + st + " ao chamar o provedor de IA: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Falha na comunicação com o provedor de IA: " + e.getMessage());
        }

        String raw = resp.content().trim();
        if (raw.startsWith("```")) raw = raw.replaceAll("```json|```", "").trim();
        int s = raw.indexOf('['), end = raw.lastIndexOf(']');
        if (s == -1 || end == -1)
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Provedor de IA retornou formato inválido.");
        raw = raw.substring(s, end + 1);

        try {
            List<Map<String, Object>> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
            List<NpsQuestionDTO> result = new ArrayList<>();
            int ordem = 0;
            for (Map<String, Object> item : parsed) {
                NpsQuestion q = new NpsQuestion();
                q.setReferenceType(refType);
                q.setReferenceId(refId);
                q.setEnunciado(String.valueOf(item.getOrDefault("enunciado", "")));
                q.setTipo(String.valueOf(item.getOrDefault("tipo", "faces")));
                q.setOrdem(ordem++);
                result.add(new NpsQuestionDTO(q));
            }
            return result;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erro ao interpretar resposta da IA: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public boolean isNpsEnabled(String refType, Long refId) {
        return configRepo.findByReferenceTypeAndReferenceId(refType, refId)
                .map(NpsConfig::getEnabled)
                .orElse(true); // padrão: habilitado
    }

    @Transactional
    public boolean setNpsEnabled(String refType, Long refId, boolean enabled) {
        NpsConfig cfg = configRepo.findByReferenceTypeAndReferenceId(refType, refId)
                .orElse(new NpsConfig());
        cfg.setReferenceType(refType);
        cfg.setReferenceId(refId);
        cfg.setEnabled(enabled);
        return configRepo.save(cfg).getEnabled();
    }

    @Transactional
    public void incrementCardAccess(Long cardId) {
        if (!cardRepository.existsById(cardId))
            throw new ResourceNotFoundException("Card not found");
        cardRepository.incrementAccessCount(cardId);
    }

    /**
     * @param startDate "YYYY-MM-DD" ou null para sem limite inferior
     * @param endDate   "YYYY-MM-DD" ou null para sem limite superior
     */
    @Transactional(readOnly = true)
    public NpsDashboardDTO getDashboard(String startDate, String endDate) {

        NpsDashboardDTO dto = new NpsDashboardDTO();

        // Total de acessos — não filtrado por data (é contador cumulativo)
        Long total = cardRepository.findAll().stream()
                .mapToLong(c -> c.getAccessCount() != null ? c.getAccessCount() : 0L)
                .sum();
        dto.setTotalCardAccesses(total);

        // Distribuição de satisfação filtrada por período
        List<Map<String, Object>> raw = responseRepo.satisfactionDistribution(startDate, endDate);
        dto.setSatisfactionDistribution(new ArrayList<>(raw));

        // Total de respostas no período
        Long totalRespostas = responseRepo.countResponses(startDate, endDate);
        dto.setTotalRespostas(totalRespostas != null ? totalRespostas : 0L);

        // Média NPS ponderada
        if (!raw.isEmpty()) {
            double weightedSum = raw.stream().mapToDouble(m -> {
                double s = m.get("score") instanceof Number n ? n.doubleValue() : 0;
                double t = m.get("total") instanceof Number n ? n.doubleValue() : 0;
                return s * t;
            }).sum();
            double totalN = raw.stream().mapToDouble(m ->
                m.get("total") instanceof Number n ? n.doubleValue() : 0
            ).sum();
            if (totalN > 0) dto.setAvgNpsScore(Math.round(weightedSum / totalN * 10.0) / 10.0);
        }

        // Top cards mais acessados — não filtrado por data
        dto.setTopCards(new ArrayList<>(cardRepository.findTopAccessedCards(100, startDate, endDate)));

        // Linha de tendência filtrada
        dto.setNpsTimeline(new ArrayList<>(responseRepo.npsTimeline(startDate, endDate)));

        return dto;
    }
}
