package com.system.UDoc.service;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.*;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UserTrailProgressService {

    private final UserTrailProgressRepository repo;
    private final UserRepository userRepository;

    public UserTrailProgressService(UserTrailProgressRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserTrailProgressDTO getProgress(Long userId, Long trailId) {
        return repo.findByUserIdAndTrailId(userId, trailId)
                .map(UserTrailProgressDTO::new)
                .orElseGet(() -> {
                    UserTrailProgressDTO dto = new UserTrailProgressDTO();
                    dto.setTrailId(trailId);
                    dto.setCurrentItemIndex(0);
                    dto.setCompletedItemsJson("[]");
                    dto.setStatus("in_progress");
                    dto.setTempoTotalSegundos(0L);
                    return dto;
                });
    }

    @Transactional
    public UserTrailProgressDTO saveProgress(Long userId, Long trailId, UserTrailProgressRequestDTO req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserTrailProgress p = repo.findByUserIdAndTrailId(userId, trailId).orElse(new UserTrailProgress());
        p.setUser(user);
        p.setTrailId(trailId);
        p.setCurrentItemIndex(req.getCurrentItemIndex());
        if (req.getCompletedItemsJson() != null) p.setCompletedItemsJson(req.getCompletedItemsJson());
        if (req.getStatus() != null) {
            p.setStatus(req.getStatus());
            // Registra data de conclusão na primeira vez que status vira "completed"
            if ("completed".equals(req.getStatus()) && p.getConcluidoEm() == null) {
                p.setConcluidoEm(LocalDateTime.now());
            }
        }
        if (req.getCertified() != null) p.setCertified(req.getCertified());

        // Registra data de início na primeira vez
        if (p.getIniciadoEm() == null) p.setIniciadoEm(LocalDateTime.now());

        p.setUpdatedAt(LocalDateTime.now());
        return new UserTrailProgressDTO(repo.save(p));
    }

    /** Acumula segundos ao tempo total da trilha — chamado a cada 30s e no beforeunload */
    @Transactional
    public void addTime(Long userId, Long trailId, long additionalSeconds) {
        if (additionalSeconds <= 0) return;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserTrailProgress p = repo.findByUserIdAndTrailId(userId, trailId).orElse(new UserTrailProgress());
        p.setUser(user);
        p.setTrailId(trailId);

        long current = p.getTempoTotalSegundos() != null ? p.getTempoTotalSegundos() : 0L;
        p.setTempoTotalSegundos(current + additionalSeconds);

        // Registra data de início se ainda não foi registrada
        if (p.getIniciadoEm() == null) p.setIniciadoEm(LocalDateTime.now());

        p.setUpdatedAt(LocalDateTime.now());
        repo.save(p);
    }
}
