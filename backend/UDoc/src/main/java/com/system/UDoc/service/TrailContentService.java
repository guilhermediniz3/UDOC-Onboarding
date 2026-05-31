package com.system.UDoc.service;
import com.system.UDoc.dto.TrailContentDTO;
import com.system.UDoc.dto.TrailContentRequestDTO;
import com.system.UDoc.entity.TrailContent;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.CardRepository;
import com.system.UDoc.repository.TrailContentRepository;
import com.system.UDoc.repository.TrailRepository;
import com.system.UDoc.repository.TrainingRoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
@Service
public class TrailContentService {
    private final TrailContentRepository trailContentRepository;
    private final TrailRepository trailRepository;
    private final CardRepository cardRepository;
    private final TrainingRoomRepository trainingRoomRepository;
    public TrailContentService(TrailContentRepository trailContentRepository, TrailRepository trailRepository, CardRepository cardRepository, TrainingRoomRepository trainingRoomRepository) {
        this.trailContentRepository = trailContentRepository; this.trailRepository = trailRepository;
        this.cardRepository = cardRepository; this.trainingRoomRepository = trainingRoomRepository;
    }
    @Transactional(readOnly = true)
    public List<TrailContentDTO> getContent(Long trailId) {
        return trailContentRepository.findByTrailIdOrderByOrdemAsc(trailId).stream().map(c -> {
            String nome = resolveNome(c.getTipo(), c.getReferenciaId());
            return new TrailContentDTO(c, nome);
        }).toList();
    }
    @Transactional
    public List<TrailContentDTO> replaceContent(Long trailId, List<TrailContentRequestDTO> requests) {
        var trail = trailRepository.findById(trailId).orElseThrow(() -> new ResourceNotFoundException("Trail not found with id " + trailId));
        trailContentRepository.deleteByTrailId(trailId);
        List<TrailContent> saved = new ArrayList<>();
        for (TrailContentRequestDTO req : requests) {
            TrailContent c = new TrailContent();
            c.setTrail(trail); c.setTipo(req.getTipo()); c.setReferenciaId(req.getReferenciaId()); c.setOrdem(req.getOrdem());
            saved.add(trailContentRepository.save(c));
        }
        return saved.stream().map(c -> new TrailContentDTO(c, resolveNome(c.getTipo(), c.getReferenciaId()))).toList();
    }
    private String resolveNome(String tipo, Long referenciaId) {
        if ("card".equals(tipo)) return cardRepository.findById(referenciaId).map(c -> c.getTitle()).orElse("Card #" + referenciaId);
        return trainingRoomRepository.findById(referenciaId).map(r -> r.getTitle()).orElse("Sala #" + referenciaId);
    }
}
