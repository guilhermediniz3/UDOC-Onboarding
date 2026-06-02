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
import java.util.stream.Collectors;

@Service
public class CardQuizService {
    private final CardQuestionRepository questionRepo;
    private final CardRepository cardRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CardQuizService(CardQuestionRepository questionRepo,
                           CardRepository cardRepository,
                           AIService aiService) {
        this.questionRepo = questionRepo;
        this.cardRepository = cardRepository;
        this.aiService = aiService;
    }

    @Transactional(readOnly = true)
    public List<CardQuestionDTO> getQuestions(Long cardId) {
        return questionRepo.findByCardIdOrderByOrdemAsc(cardId).stream().map(CardQuestionDTO::new).toList();
    }

    @Transactional
    public List<CardQuestionDTO> replaceQuestions(Long cardId, List<CardQuestionRequestDTO> requests) {
        Card card = cardRepository.findById(cardId).orElseThrow(() -> new ResourceNotFoundException("Card not found"));
        questionRepo.deleteByCardId(cardId);
        List<CardQuestion> saved = new ArrayList<>();
        int i = 0;
        for (CardQuestionRequestDTO req : requests) {
            CardQuestion q = new CardQuestion();
            q.setCard(card); q.setEnunciado(req.getEnunciado()); q.setTipo(req.getTipo());
            q.setRespostaCorreta(req.getRespostaCorreta()); q.setPontos(req.getPontos());
            q.setOrdem(req.getOrdem() != null ? req.getOrdem() : i++);
            if (req.getOpcoes() != null && !req.getOpcoes().isEmpty()) {
                String json = "[" + req.getOpcoes().stream().map(o -> "\"" + o.replace("\"","\\\"") + "\"").collect(Collectors.joining(",")) + "]";
                q.setOpcoes(json);
            }
            saved.add(questionRepo.save(q));
        }
        return saved.stream().map(CardQuestionDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Double getTotalPontos(Long cardId) {
        Double total = questionRepo.sumPontosByCardId(cardId);
        return total != null ? total : 0.0;
    }

    /** Gera 5 perguntas de quiz para o card usando o Groq */
    @Transactional(readOnly = true)
    public List<CardQuestionDTO> generateQuestionsWithGroq(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        StringBuilder context = new StringBuilder();
        context.append("### ").append(card.getTitle()).append("\n");
        if (card.getDescription() != null && !card.getDescription().isBlank())
            context.append(card.getDescription()).append("\n");
        if (card.getContent() != null && !card.getContent().isBlank())
            context.append(card.getContent().replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim()).append("\n");

        if (context.length() < 10)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O card nao possui conteudo suficiente para gerar perguntas.");

        String prompt = """
            Com base no seguinte conteudo educacional, gere 5 perguntas de verificacao de conhecimento em portugues brasileiro.
            Retorne APENAS um JSON array valido no seguinte formato, sem texto adicional, sem markdown:
            [{"enunciado":"string","tipo":"vf|multipla","opcoes":["opcao1","opcao2","opcao3","opcao4"],"resposta_correta":"string","pontos":1.0}]
            Para perguntas do tipo "vf", as opcoes devem ser ["Verdadeiro","Falso"].
            Para perguntas do tipo "multipla", inclua exatamente 4 opcoes.
            Conteudo:
            """ + context;

        String raw = callGroq(prompt);
        return parseQuizResponse(raw);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private String callGroq(String prompt) {
        AIResponseDTO resp;
        try {
            resp = aiService.generate(prompt);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            int st = e.getStatusCode().value();
            String body = e.getResponseBodyAsString();
            System.err.println("[Groq/CardQuiz] HTTP " + st + ": " + body);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Erro " + st + " ao chamar o Groq: " + body);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Falha na comunicacao com o Groq: " + e.getMessage());
        }
        String raw = resp.content().trim();
        if (raw.startsWith("```")) raw = raw.replaceAll("```json|```", "").trim();
        int s = raw.indexOf('['), end = raw.lastIndexOf(']');
        if (s == -1 || end == -1)
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Groq retornou formato invalido.");
        return raw.substring(s, end + 1);
    }

    private List<CardQuestionDTO> parseQuizResponse(String raw) {
        try {
            List<Map<String, Object>> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
            List<CardQuestionDTO> result = new ArrayList<>();
            int ordem = 0;
            for (Map<String, Object> item : parsed) {
                CardQuestionDTO dto = new CardQuestionDTO();
                dto.setEnunciado(String.valueOf(item.getOrDefault("enunciado", "")));
                dto.setTipo(String.valueOf(item.getOrDefault("tipo", "vf")));
                dto.setRespostaCorreta(String.valueOf(item.getOrDefault("resposta_correta", "")));
                Object pts = item.get("pontos");
                dto.setPontos(pts instanceof Number ? ((Number) pts).doubleValue() : 1.0);
                dto.setOrdem(ordem++);
                Object opcs = item.get("opcoes");
                if (opcs instanceof List<?> list)
                    dto.setOpcoes(list.stream().map(Object::toString).toList());
                result.add(dto);
            }
            return result;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erro ao interpretar resposta da IA: " + e.getMessage());
        }
    }
}
