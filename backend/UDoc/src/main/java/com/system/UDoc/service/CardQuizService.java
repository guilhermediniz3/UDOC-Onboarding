package com.system.UDoc.service;
import com.system.UDoc.dto.*;
import com.system.UDoc.entity.*;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;
@Service
public class CardQuizService {
    private final CardQuestionRepository questionRepo;
    private final CardRepository cardRepository;
    public CardQuizService(CardQuestionRepository questionRepo, CardRepository cardRepository) {
        this.questionRepo = questionRepo; this.cardRepository = cardRepository;
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
}
