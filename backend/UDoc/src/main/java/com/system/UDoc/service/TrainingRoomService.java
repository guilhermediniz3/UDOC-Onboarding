package com.system.UDoc.service;

import com.system.UDoc.dto.TrainingRoomDTO;
import com.system.UDoc.dto.TrainingRoomRequestDTO;
import com.system.UDoc.entity.*;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
public class TrainingRoomService {
    private final TrainingRoomRepository trainingRoomRepository;
    private final CompanyRepository companyRepository;
    private final IsmRepository ismRepository;
    private final TrailRepository trailRepository;
    private final EmployeeRepository employeeRepository;

    public TrainingRoomService(TrainingRoomRepository trainingRoomRepository, CompanyRepository companyRepository, IsmRepository ismRepository, TrailRepository trailRepository, EmployeeRepository employeeRepository) {
        this.trainingRoomRepository = trainingRoomRepository; this.companyRepository = companyRepository;
        this.ismRepository = ismRepository; this.trailRepository = trailRepository; this.employeeRepository = employeeRepository;
    }

    @Transactional public TrainingRoomDTO createTrainingRoom(TrainingRoomRequestDTO request) { TrainingRoom r = new TrainingRoom(); mapToEntity(request, r); return new TrainingRoomDTO(trainingRoomRepository.save(r)); }
    @Transactional(readOnly = true) public Page<TrainingRoomDTO> getAllTrainingRooms(String search, Boolean active, Pageable pageable) { return trainingRoomRepository.search(search, active, pageable).map(TrainingRoomDTO::new); }
    @Transactional(readOnly = true) public TrainingRoomDTO getTrainingRoomById(Long id) { return new TrainingRoomDTO(findById(id)); }
    @Transactional public TrainingRoomDTO updateTrainingRoom(Long id, TrainingRoomRequestDTO request) { TrainingRoom r = findById(id); mapToEntity(request, r); return new TrainingRoomDTO(trainingRoomRepository.save(r)); }
    @Transactional public void deleteTrainingRoom(Long id) { if (!trainingRoomRepository.existsById(id)) throw new ResourceNotFoundException("Training room not found with id " + id); trainingRoomRepository.deleteById(id); }

    private TrainingRoom findById(Long id) { return trainingRoomRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Training room not found with id " + id)); }

    private void mapToEntity(TrainingRoomRequestDTO r, TrainingRoom room) {
        room.setTitle(r.getTitle()); room.setDescription(r.getDescription());
        room.setSortOrder(r.getSortOrder() != null ? r.getSortOrder() : 0); room.setActive(r.getActive());
        room.setVimeoUrl(r.getVimeoUrl()); room.setYoutubeUrl(r.getYoutubeUrl());
        if (r.getStatus() != null && !r.getStatus().isBlank()) { try { room.setStatus(TrainingRoomStatus.valueOf(r.getStatus())); } catch (IllegalArgumentException ignored) { room.setStatus(TrainingRoomStatus.AGENDADA); } }
        room.setCompany(r.getCompanyId() != null ? companyRepository.findById(r.getCompanyId()).orElseThrow(() -> new ResourceNotFoundException("Company not found")) : null);
        room.setIsm(r.getIsmId() != null ? ismRepository.findById(r.getIsmId()).orElseThrow(() -> new ResourceNotFoundException("ISM not found")) : null);
        room.setTrail(r.getTrailId() != null ? trailRepository.findById(r.getTrailId()).orElseThrow(() -> new ResourceNotFoundException("Trail not found")) : null);
        List<Employee> employees = new ArrayList<>();
        if (r.getInvitedEmployeeIds() != null) for (Long eid : r.getInvitedEmployeeIds()) employees.add(employeeRepository.findById(eid).orElseThrow(() -> new ResourceNotFoundException("Employee not found with id " + eid)));
        room.setInvitedEmployees(employees);
    }
}
