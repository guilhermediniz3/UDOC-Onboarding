package com.system.UDoc.service;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.*;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class NpsService {

    private final NpsQuestionRepository questionRepo;
    private final NpsResponseRepository responseRepo;
    private final CardRepository cardRepository;

    public NpsService(NpsQuestionRepository questionRepo,
                      NpsResponseRepository responseRepo,
                      CardRepository cardRepository) {
        this.questionRepo = questionRepo;
        this.responseRepo = responseRepo;
        this.cardRepository = cardRepository;
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
        dto.setTopCards(new ArrayList<>(cardRepository.findTopAccessedCards(10)));

        // Linha de tendência filtrada
        dto.setNpsTimeline(new ArrayList<>(responseRepo.npsTimeline(startDate, endDate)));

        return dto;
    }
}
