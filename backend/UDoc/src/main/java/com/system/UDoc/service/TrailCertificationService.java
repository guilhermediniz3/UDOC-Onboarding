package com.system.UDoc.service;
import com.system.UDoc.dto.TrailCertificationConfigDTO;
import com.system.UDoc.dto.TrailQuestionDTO;
import com.system.UDoc.dto.TrailQuestionRequestDTO;
import com.system.UDoc.entity.Trail;
import com.system.UDoc.entity.TrailCertificationConfig;
import com.system.UDoc.entity.TrailQuestion;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import com.system.UDoc.entity.TrailContent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
@Service
public class TrailCertificationService {
    private final TrailCertificationConfigRepository configRepository;
    private final TrailQuestionRepository questionRepository;
    private final TrailRepository trailRepository;
    private final AIService aiService;
    private final TrailContentRepository trailContentRepository;
    private final CardRepository cardRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    public TrailCertificationService(TrailCertificationConfigRepository configRepository, TrailQuestionRepository questionRepository, TrailRepository trailRepository, AIService aiService, TrailContentRepository trailContentRepository, CardRepository cardRepository) {
        this.configRepository = configRepository; this.questionRepository = questionRepository; this.trailRepository = trailRepository; this.aiService = aiService; this.trailContentRepository = trailContentRepository; this.cardRepository = cardRepository;
    }
    @Transactional(readOnly = true)
    public TrailCertificationConfigDTO getConfig(Long trailId) {
        Double total = questionRepository.sumPontosByTrailId(trailId);
        int qtd = questionRepository.countByTrailId(trailId);
        return configRepository.findByTrailId(trailId)
            .map(c -> new TrailCertificationConfigDTO(c, total, qtd))
            .orElseGet(() -> {
                TrailCertificationConfigDTO dto = new TrailCertificationConfigDTO();
                dto.setTrailId(trailId); dto.setNotaMinima(7.0); dto.setTotalPontos(total != null ? total : 0.0); dto.setQuantidadePerguntas(qtd);
                return dto;
            });
    }
    @Transactional
    public TrailCertificationConfigDTO saveConfig(Long trailId, Double notaMinima) {
        Trail trail = trailRepository.findById(trailId).orElseThrow(() -> new ResourceNotFoundException("Trail not found with id " + trailId));
        TrailCertificationConfig config = configRepository.findByTrailId(trailId).orElse(new TrailCertificationConfig());
        config.setTrail(trail); config.setNotaMinima(notaMinima);
        config = configRepository.save(config);
        Double total = questionRepository.sumPontosByTrailId(trailId);
        int qtd = questionRepository.countByTrailId(trailId);
        return new TrailCertificationConfigDTO(config, total, qtd);
    }
    @Transactional(readOnly = true)
    public List<TrailQuestionDTO> getQuestions(Long trailId) {
        return questionRepository.findByTrailIdOrderByOrdemAsc(trailId).stream().map(TrailQuestionDTO::new).toList();
    }
    @Transactional
    public List<TrailQuestionDTO> replaceQuestions(Long trailId, List<TrailQuestionRequestDTO> requests) {
        Trail trail = trailRepository.findById(trailId).orElseThrow(() -> new ResourceNotFoundException("Trail not found with id " + trailId));
        questionRepository.deleteByTrailId(trailId);
        List<TrailQuestion> saved = new ArrayList<>();
        int i = 0;
        for (TrailQuestionRequestDTO req : requests) {
            TrailQuestion q = new TrailQuestion();
            q.setTrail(trail); q.setEnunciado(req.getEnunciado()); q.setTipo(req.getTipo());
            q.setRespostaCorreta(req.getRespostaCorreta()); q.setPontos(req.getPontos());
            q.setOrdem(req.getOrdem() != null ? req.getOrdem() : i);
            if (req.getOpcoes() != null && !req.getOpcoes().isEmpty()) {
                String json = "[" + req.getOpcoes().stream().map(o -> "\"" + o.replace("\"","\\\"") + "\"").collect(Collectors.joining(",")) + "]";
                q.setOpcoes(json);
            }
            saved.add(questionRepository.save(q));
            i++;
        }
        return saved.stream().map(TrailQuestionDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public List<TrailQuestionDTO> generateQuestionsWithGroq(Long trailId) {
        StringBuilder context = new StringBuilder();
        int[] cardCount = {0};

        // ── 1. Tenta cards via nova aba Conteúdo (trail_content) ─────────────
        List<TrailContent> contents = trailContentRepository.findByTrailIdOrderByOrdemAsc(trailId);
        for (TrailContent tc : contents) {
            if ("card".equals(tc.getTipo())) {
                cardRepository.findById(tc.getReferenciaId()).ifPresent(card -> {
                    appendCardContext(context, card);
                    cardCount[0]++;
                });
            }
        }

        // ── 2. Fallback: cards via relacionamento antigo trail_card ───────────
        if (context.length() == 0) {
            Trail trail = trailRepository.findById(trailId)
                    .orElseThrow(() -> new ResourceNotFoundException("Trail not found with id " + trailId));
            for (var card : trail.getCards()) {
                appendCardContext(context, card);
                cardCount[0]++;
            }
        }

        if (context.length() == 0) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "A trilha nao possui cards com conteudo vinculado. Adicione cards na aba 'Conteudo' ou vincule cards diretamente a trilha.");
        }

        // Mínimo 5, 1 por card até 10, teto de 10 para não tornar o quiz excessivo
        int total = Math.min(Math.max(cardCount[0], 5), 10);
        boolean maisCardsQuePerguntas = cardCount[0] > total;

        String distribuicaoRegra = maisCardsQuePerguntas
            ? "- Ha " + cardCount[0] + " cards mas o quiz tem " + total + " perguntas: " +
              "selecione os conceitos mais importantes e representativos, garantindo que os principais temas de cada card sejam contemplados\n"
            : "- Distribua ao menos 1 pergunta por card (cubra todos os " + cardCount[0] + " cards)\n" +
              (cardCount[0] < 5 ? "- Como ha poucos cards, complemente com perguntas adicionais sobre os temas ja abordados\n" : "");

        String prompt =
            "Com base no conteudo educacional abaixo, organizado em " + cardCount[0] + " card(s), " +
            "gere perguntas de certificacao da TRILHA em portugues brasileiro.\n\n" +
            "REGRAS OBRIGATORIAS:\n" +
            "- Gere EXATAMENTE " + total + " perguntas\n" +
            distribuicaoRegra +
            "- As perguntas da TRILHA devem ser DIFERENTES das perguntas internas de cada card: " +
              "teste a compreensao geral e a relacao entre os temas, nao detalhes isolados ja cobertos no quiz do card\n\n" +
            "Retorne APENAS um JSON array valido, sem texto adicional, sem markdown:\n" +
            "[{\"enunciado\":\"string\",\"tipo\":\"vf|multipla\"," +
             "\"opcoes\":[\"opcao1\",\"opcao2\",\"opcao3\",\"opcao4\"],\"resposta_correta\":\"string\",\"pontos\":1.0}]\n" +
            "Para tipo \"vf\": opcoes deve ser [\"Verdadeiro\",\"Falso\"].\n" +
            "Para tipo \"multipla\": inclua exatamente 4 opcoes.\n\n" +
            "Conteudo dos cards:\n" + context.toString();
        // Captura erros do provedor de IA para nao propagar o status HTTP externo ao frontend (evita logout)
        com.system.UDoc.dto.AIResponseDTO aiResponse;
        try {
            aiResponse = aiService.generate(prompt);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            String body = e.getResponseBodyAsString();
            System.err.println("[IA] Erro HTTP " + status + " — corpo da resposta: " + body);
            String msg;
            if (status == 401) {
                msg = "Provedor de IA retornou 401. A chave pode ter expirado ou sido revogada. Verifique em Integrações. Detalhes: " + body;
            } else if (status == 403) {
                msg = "Provedor de IA retornou 403 (sem permissão para o modelo configurado). Detalhes: " + body;
            } else if (status == 400) {
                msg = "Provedor de IA recusou a requisição (400). O conteúdo pode ser muito longo. Detalhes: " + body;
            } else {
                msg = "Erro HTTP " + status + " ao chamar o provedor de IA. Detalhes: " + body;
            }
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, msg);
        } catch (Exception e) {
            System.err.println("[IA] Exceção: " + e.getClass().getSimpleName() + " — " + e.getMessage());
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Falha na comunicação com o provedor de IA (" + e.getClass().getSimpleName() + "): " + e.getMessage());
        }
        String raw = aiResponse.content().trim();
        if (raw.startsWith("```")) { raw = raw.replaceAll("```json|```","").trim(); }
        int start = raw.indexOf('['); int end = raw.lastIndexOf(']');
        if (start == -1 || end == -1) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Provedor de IA retornou formato inválido.");
        raw = raw.substring(start, end + 1);
        try {
            List<Map<String, Object>> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
            List<TrailQuestionDTO> result = new java.util.ArrayList<>();
            int ordem = 0;
            for (Map<String, Object> item : parsed) {
                TrailQuestionDTO dto = new TrailQuestionDTO();
                dto.setEnunciado(String.valueOf(item.getOrDefault("enunciado","")));
                dto.setTipo(String.valueOf(item.getOrDefault("tipo","vf")));
                dto.setRespostaCorreta(String.valueOf(item.getOrDefault("resposta_correta","")));
                Object pts = item.get("pontos"); dto.setPontos(pts instanceof Number ? ((Number)pts).doubleValue() : 1.0);
                dto.setOrdem(ordem++);
                Object opcs = item.get("opcoes");
                if (opcs instanceof List) { dto.setOpcoes(((List<?>)opcs).stream().map(Object::toString).toList()); }
                result.add(dto);
            }
            return result;
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao interpretar resposta da IA: " + e.getMessage());
        }
    }

    private void appendCardContext(StringBuilder sb, com.system.UDoc.entity.Card card) {
        sb.append("### ").append(card.getTitle()).append("\n");
        if (card.getDescription() != null && !card.getDescription().isBlank()) {
            sb.append(card.getDescription()).append("\n");
        }
        if (card.getContent() != null && !card.getContent().isBlank()) {
            // Remove tags HTML para enviar texto limpo
            sb.append(card.getContent().replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim()).append("\n");
        }
        sb.append("\n");
    }
}
