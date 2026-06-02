package com.system.UDoc.service;

import com.system.UDoc.dto.TrainingRoomDTO;
import com.system.UDoc.dto.TrainingRoomRequestDTO;
import com.system.UDoc.entity.*;
import com.system.UDoc.exception.ResourceNotFoundException;

import java.util.UUID;
import com.system.UDoc.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class TrainingRoomService {
    private final TrainingRoomRepository trainingRoomRepository;
    private final CompanyRepository companyRepository;
    private final IsmRepository ismRepository;
    private final TrailRepository trailRepository;
    private final EmployeeRepository employeeRepository;
    private final EmailService emailService;

    public TrainingRoomService(TrainingRoomRepository trainingRoomRepository,
                               CompanyRepository companyRepository,
                               IsmRepository ismRepository,
                               TrailRepository trailRepository,
                               EmployeeRepository employeeRepository,
                               EmailService emailService) {
        this.trainingRoomRepository = trainingRoomRepository;
        this.companyRepository = companyRepository;
        this.ismRepository = ismRepository;
        this.trailRepository = trailRepository;
        this.employeeRepository = employeeRepository;
        this.emailService = emailService;
    }

    /** Envia convites por e-mail para todos os funcionários convidados da sala */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> sendInviteEmails(Long roomId, String jitsiLink) {
        TrainingRoom room = findById(roomId);
        String roomTitle = room.getTitle();
        String ismName   = room.getIsm() != null ? room.getIsm().getName() : null;
        List<Employee> invited = room.getInvitedEmployees();
        java.util.List<String> sentTo  = new java.util.ArrayList<>();
        java.util.List<String> failed  = new java.util.ArrayList<>();
        for (Employee emp : invited) {
            if (emp.getEmail() != null && !emp.getEmail().isBlank()) {
                try {
                    emailService.sendTrainingInvite(emp.getEmail(), emp.getName(), roomTitle, jitsiLink, ismName);
                    sentTo.add(emp.getEmail());
                } catch (Exception e) {
                    System.err.println("[Invite] Falha ao enviar para " + emp.getEmail() + ": " + e.getMessage());
                    failed.add(emp.getEmail());
                }
            }
        }
        return java.util.Map.of("sent", sentTo.size(), "emails", sentTo, "failed", failed);
    }

    @Transactional
    public TrainingRoomDTO createTrainingRoom(TrainingRoomRequestDTO request) {
        TrainingRoom r = new TrainingRoom();
        mapToEntity(request, r);
        if (r.getTrail() != null) {
            shiftOrderIfConflict(r.getTrail().getId(), null, r.getSortOrder());
        }
        return new TrainingRoomDTO(trainingRoomRepository.save(r));
    }

    /** Retorna o próximo sortOrder disponível para salas de uma trilha */
    @Transactional(readOnly = true)
    public int getNextSortOrder(Long trailId) {
        Integer max = trainingRoomRepository.findMaxSortOrderByTrailId(trailId);
        return (max != null ? max : -1) + 1;
    }

    @Transactional(readOnly = true) public Page<TrainingRoomDTO> getAllTrainingRooms(String search, Boolean active, Pageable pageable) { return trainingRoomRepository.search(normalize(search), active, pageable).map(TrainingRoomDTO::new); }
    private String normalize(String s) { return (s == null || s.isBlank()) ? null : s; }
    @Transactional(readOnly = true) public TrainingRoomDTO getTrainingRoomById(Long id) { return new TrainingRoomDTO(findById(id)); }

    @Transactional
    public TrainingRoomDTO updateTrainingRoom(Long id, TrainingRoomRequestDTO request) {
        TrainingRoom r = findById(id);
        mapToEntity(request, r);
        if (r.getTrail() != null) {
            shiftOrderIfConflict(r.getTrail().getId(), id, r.getSortOrder());
        }
        return new TrainingRoomDTO(trainingRoomRepository.save(r));
    }

    @Transactional public void deleteTrainingRoom(Long id) { if (!trainingRoomRepository.existsById(id)) throw new ResourceNotFoundException("Training room not found with id " + id); trainingRoomRepository.deleteById(id); }

    /** Desloca para frente salas com sortOrder >= targetOrder (exceto a sala corrente) */
    private void shiftOrderIfConflict(Long trailId, Long excludeId, int targetOrder) {
        List<TrainingRoom> conflicting = trainingRoomRepository
                .findByTrailIdAndSortOrderGte(trailId, targetOrder, excludeId);
        if (conflicting.isEmpty()) return;
        // Ordem decrescente evita colisões durante o shift em cascata
        for (int i = conflicting.size() - 1; i >= 0; i--) {
            TrainingRoom room = conflicting.get(i);
            room.setSortOrder(room.getSortOrder() + 1);
            trainingRoomRepository.save(room);
        }
    }

    private TrainingRoom findById(Long id) { return trainingRoomRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Training room not found with id " + id)); }

    private void mapToEntity(TrainingRoomRequestDTO r, TrainingRoom room) {
        room.setTitle(r.getTitle()); room.setDescription(r.getDescription());
        room.setSortOrder(r.getSortOrder() != null ? r.getSortOrder() : 0); room.setActive(r.getActive());
        room.setVimeoUrl(r.getVimeoUrl()); room.setYoutubeUrl(r.getYoutubeUrl());

        // Garante que jitsiRoomId nunca seja nulo (salas criadas antes do campo existir)
        if (room.getJitsiRoomId() == null || room.getJitsiRoomId().isBlank()) {
            room.setJitsiRoomId("udoc-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        }

        if (r.getStatus() != null && !r.getStatus().isBlank()) {
            try {
                room.setStatus(TrainingRoomStatus.valueOf(r.getStatus()));
            } catch (IllegalArgumentException ignored) {
                room.setStatus(TrainingRoomStatus.AGENDADA);
            }
        }
        room.setCompany(r.getCompanyId() != null ? companyRepository.findById(r.getCompanyId()).orElseThrow(() -> new ResourceNotFoundException("Company not found")) : null);
        room.setIsm(r.getIsmId() != null ? ismRepository.findById(r.getIsmId()).orElseThrow(() -> new ResourceNotFoundException("ISM not found")) : null);
        room.setTrail(r.getTrailId() != null ? trailRepository.findById(r.getTrailId()).orElseThrow(() -> new ResourceNotFoundException("Trail not found")) : null);
        List<Employee> employees = new ArrayList<>();
        if (r.getInvitedEmployeeIds() != null) for (Long eid : r.getInvitedEmployeeIds()) employees.add(employeeRepository.findById(eid).orElseThrow(() -> new ResourceNotFoundException("Employee not found with id " + eid)));
        room.setInvitedEmployees(employees);
    }
}
