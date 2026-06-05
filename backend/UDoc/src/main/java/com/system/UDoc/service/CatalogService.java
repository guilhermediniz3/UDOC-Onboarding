package com.system.UDoc.service;

import com.system.UDoc.entity.*;
import com.system.UDoc.entity.Trail.Visibilidade;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CatalogService {

    private final TrailRepository                trailRepo;
    private final UserTrailProgressRepository    progressRepo;
    private final TrainingRoomRepository         roomRepo;
    private final EmployeeRepository             employeeRepo;
    private final IsmRepository                  ismRepo;

    public CatalogService(TrailRepository trailRepo,
                          UserTrailProgressRepository progressRepo,
                          TrainingRoomRepository roomRepo,
                          EmployeeRepository employeeRepo,
                          IsmRepository ismRepo) {
        this.trailRepo    = trailRepo;
        this.progressRepo = progressRepo;
        this.roomRepo     = roomRepo;
        this.employeeRepo = employeeRepo;
        this.ismRepo      = ismRepo;
    }

    // ── Listar trilhas do catálogo ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CatalogTrailDTO> getCatalog(User user, String search) {

        String[] visibilidades = resolveVisibilidades(user);
        String   searchParam   = (search == null || search.isBlank()) ? null : search;

        List<Trail> trails = trailRepo.findCatalog(visibilidades, searchParam);

        // Pré-carrega progresso do usuário para evitar N+1
        Map<Long, UserTrailProgress> progressMap = progressRepo.findByUserId(user.getId())
                .stream().collect(Collectors.toMap(p -> p.getTrailId(), p -> p));

        // Verifica matrículas via sala para este usuário
        Employee emp = employeeRepo.findByUserId(user.getId()).orElse(null);

        return trails.stream().map(trail -> {
            UserTrailProgress prog = progressMap.get(trail.getId());

            // Determina status de matrícula
            String enrollStatus;
            if (prog != null && Boolean.TRUE.equals(prog.getCertified())) {
                enrollStatus = "COMPLETED";
            } else if (prog != null) {
                enrollStatus = "IN_PROGRESS";
            } else if (emp != null && roomRepo.existsByTrailIdAndEmployee(trail.getId(), emp.getId())) {
                enrollStatus = "ENROLLED";
            } else {
                enrollStatus = "AVAILABLE";
            }

            return new CatalogTrailDTO(
                trail.getId(),
                trail.getName(),
                trail.getDescription(),
                trail.getCards() != null ? trail.getCards().size() : 0,
                trail.getVisibilidade() != null ? trail.getVisibilidade().name() : "AMBAS",
                enrollStatus
            );
        }).toList();
    }

    // ── Matricular via catálogo ───────────────────────────────────────────────

    @Transactional
    public void enroll(User user, Long trailId) {

        Trail trail = trailRepo.findById(trailId)
                .orElseThrow(() -> new ResourceNotFoundException("Trilha não encontrada: " + trailId));

        if (!Boolean.TRUE.equals(trail.getActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trilha inativa.");
        }

        Employee employee = employeeRepo.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Usuário sem funcionário vinculado."));

        // Verifica se já está matriculado
        if (roomRepo.existsByTrailIdAndEmployee(trailId, employee.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Funcionário já está matriculado nesta trilha.");
        }

        // ISM de sistema "Auto Matrícula"
        Ism autoIsm = ismRepo.findBySistemaIsmTrue()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "ISM Auto Matrícula não encontrado. Contate o administrador."));

        // Reutiliza sala de auto-matrícula já existente para (trilha, empresa)
        // ou cria uma nova — mesma lógica que uma sala normal, mas com ISM especial
        TrainingRoom room = roomRepo.findAutoEnrollRoom(
                        trailId, employee.getCompany().getId(), autoIsm.getId())
                .orElseGet(() -> {
                    TrainingRoom nova = new TrainingRoom();
                    nova.setTitle("Auto Matrícula — " + trail.getName());
                    nova.setTrail(trail);
                    nova.setCompany(employee.getCompany());
                    nova.setIsm(autoIsm);
                    nova.setStatus(TrainingRoomStatus.EM_ANDAMENTO);
                    nova.setActive(true);
                    nova.setSortOrder(0);
                    return roomRepo.save(nova);
                });

        // Adiciona funcionário à sala (mesmo mecanismo de convite das salas normais)
        if (!room.getInvitedEmployees().contains(employee)) {
            room.getInvitedEmployees().add(employee);
            roomRepo.save(room);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String[] resolveVisibilidades(User user) {
        Role role = user.getRole();
        if (role == Role.ADMIN || role == Role.ISM) {
            return new String[]{"INTERNA", "EXTERNA", "AMBAS"};
        }
        // Funcionário: distingue por employee.tipo
        Employee emp = employeeRepo.findByUserId(user.getId()).orElse(null);
        if (emp != null && "INTERNO".equals(emp.getTipo())) {
            return new String[]{"INTERNA", "AMBAS"};
        }
        return new String[]{"EXTERNA", "AMBAS"};
    }

    // ── DTO ───────────────────────────────────────────────────────────────────

    public record CatalogTrailDTO(
        Long   id,
        String name,
        String description,
        int    totalCards,
        String visibilidade,
        String enrollStatus   // AVAILABLE | ENROLLED | IN_PROGRESS | COMPLETED
    ) {}
}
