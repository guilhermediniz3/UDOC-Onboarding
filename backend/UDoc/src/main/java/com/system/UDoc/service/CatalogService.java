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
    private final TrailContentRepository         trailContentRepo;

    public CatalogService(TrailRepository trailRepo,
                          UserTrailProgressRepository progressRepo,
                          TrainingRoomRepository roomRepo,
                          EmployeeRepository employeeRepo,
                          IsmRepository ismRepo,
                          TrailContentRepository trailContentRepo) {
        this.trailRepo    = trailRepo;
        this.progressRepo = progressRepo;
        this.roomRepo     = roomRepo;
        this.employeeRepo = employeeRepo;
        this.ismRepo      = ismRepo;
        this.trailContentRepo = trailContentRepo;
    }

    // ── Listar trilhas do catálogo ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CatalogTrailDTO> getCatalog(User user, String search) {

        java.util.List<Trail.Visibilidade> visibilidades = resolveVisibilidades(user);
        String searchParam = (search == null || search.isBlank()) ? null : "%" + search.toLowerCase() + "%";

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
            } else if (emp != null && roomRepo.countByTrailIdAndEmployee(trail.getId(), emp.getId()) > 0) {
                enrollStatus = "ENROLLED";
            } else {
                enrollStatus = "AVAILABLE";
            }

            return new CatalogTrailDTO(
                trail.getId(),
                trail.getName(),
                trail.getDescription(),
                (int) trailContentRepo.countByTrailIdAndTipo(trail.getId(), "card"),
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
        if (roomRepo.countByTrailIdAndEmployee(trailId, employee.getId()) > 0) {
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

    private List<Visibilidade> resolveVisibilidades(User user) {
        Role role = user.getRole();
        if (role == Role.ADMIN || role == Role.ISM || role == Role.GESTOR) {
            return List.of(Visibilidade.INTERNA, Visibilidade.EXTERNA, Visibilidade.AMBAS);
        }
        Employee emp = employeeRepo.findByUserId(user.getId()).orElse(null);
        if (emp != null && "INTERNO".equals(emp.getTipo())) {
            return List.of(Visibilidade.INTERNA, Visibilidade.AMBAS);
        }
        return List.of(Visibilidade.EXTERNA, Visibilidade.AMBAS);
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
