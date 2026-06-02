package com.system.UDoc.service;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.*;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserTrailProgressService {

    private final UserTrailProgressRepository repo;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final TrailRepository trailRepository;
    private final TrainingRoomRepository trainingRoomRepository;

    public UserTrailProgressService(UserTrailProgressRepository repo,
                                    UserRepository userRepository,
                                    EmployeeRepository employeeRepository,
                                    TrailRepository trailRepository,
                                    TrainingRoomRepository trainingRoomRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.trailRepository = trailRepository;
        this.trainingRoomRepository = trainingRoomRepository;
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
        if (req.getNotaObtida() != null) p.setNotaObtida(req.getNotaObtida());

        // Registra data de início na primeira vez
        if (p.getIniciadoEm() == null) p.setIniciadoEm(LocalDateTime.now());

        p.setUpdatedAt(LocalDateTime.now());
        return new UserTrailProgressDTO(repo.save(p));
    }

    /** Retorna todos os certificados obtidos pelo usuário (trilhas com certified=true) */
    @Transactional(readOnly = true)
    public List<CertificateInfoDTO> getMyCertificates(Long userId) {
        List<UserTrailProgress> certifiedList = repo.findByUserIdAndCertifiedTrue(userId);

        // Dados do funcionário vinculado ao usuário
        var employeeOpt = employeeRepository.findByUserId(userId);
        String employeeName = employeeOpt.map(Employee::getName).orElse(null);
        String companyName  = employeeOpt.map(e -> e.getCompany() != null ? e.getCompany().getName() : null).orElse(null);

        return certifiedList.stream().map(p -> {
            CertificateInfoDTO dto = new CertificateInfoDTO();
            dto.setTrailId(p.getTrailId());
            dto.setNotaObtida(p.getNotaObtida());
            dto.setTempoTotalSegundos(p.getTempoTotalSegundos() != null ? p.getTempoTotalSegundos() : 0L);
            dto.setIniciadoEm(p.getIniciadoEm());
            dto.setConcluidoEm(p.getConcluidoEm());
            dto.setEmployeeName(employeeName);
            dto.setCompanyName(companyName);

            trailRepository.findById(p.getTrailId()).ifPresent(trail -> {
                dto.setTrailName(trail.getName());
                dto.setTrailDescription(trail.getDescription());
            });

            try {
                trainingRoomRepository.findByTrailIdWithCompany(p.getTrailId()).stream()
                        .filter(r -> r.getIsm() != null)
                        .findFirst()
                        .ifPresent(r -> dto.setIsmName(r.getIsm().getName()));
            } catch (Exception ignored) {}

            return dto;
        }).toList();
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
