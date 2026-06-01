package com.system.UDoc.service;
import com.system.UDoc.dto.*;
import com.system.UDoc.entity.*;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
@Service
public class TrainingService {
    private final TrainingRepository trainingRepository;
    private final TrainingEmployeeRepository trainingEmployeeRepository;
    private final CompanyRepository companyRepository;
    private final TrailRepository trailRepository;
    private final TrainingRoomRepository trainingRoomRepository;
    private final EmployeeRepository employeeRepository;
    private final TrailCertificationConfigRepository certConfigRepository;
    private final UserTrailProgressRepository progressRepository;

    public TrainingService(TrainingRepository trainingRepository, TrainingEmployeeRepository trainingEmployeeRepository, CompanyRepository companyRepository, TrailRepository trailRepository, TrainingRoomRepository trainingRoomRepository, EmployeeRepository employeeRepository, TrailCertificationConfigRepository certConfigRepository, UserTrailProgressRepository progressRepository) {
        this.trainingRepository = trainingRepository; this.trainingEmployeeRepository = trainingEmployeeRepository;
        this.companyRepository = companyRepository; this.trailRepository = trailRepository;
        this.trainingRoomRepository = trainingRoomRepository; this.employeeRepository = employeeRepository;
        this.certConfigRepository = certConfigRepository;
        this.progressRepository = progressRepository;
    }
    @Transactional
    public TrainingDTO createTraining(TrainingRequestDTO req) {
        Training t = new Training();
        t.setCompany(companyRepository.findById(req.getCompanyId()).orElseThrow(() -> new ResourceNotFoundException("Company not found")));
        t.setTrail(trailRepository.findById(req.getTrailId()).orElseThrow(() -> new ResourceNotFoundException("Trail not found")));
        if (req.getTrainingRoomId() != null) t.setTrainingRoom(trainingRoomRepository.findById(req.getTrainingRoomId()).orElse(null));
        t.setDataInicio(req.getDataInicio()); t.setDataConclusao(req.getDataConclusao());
        return new TrainingDTO(trainingRepository.save(t));
    }
    @Transactional(readOnly = true)
    public List<TrainingDTO> getTrainingsForTrail(Long trailId) {
        return trainingRepository.findByTrailIdOrderByDataInicioDesc(trailId).stream().map(TrainingDTO::new).toList();
    }
    @Transactional
    public TrainingEmployeeDTO addEmployee(Long trainingId, TrainingEmployeeRequestDTO req) {
        Training training = trainingRepository.findById(trainingId).orElseThrow(() -> new ResourceNotFoundException("Training not found"));
        Employee employee = employeeRepository.findById(req.getEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        TrainingEmployee te = new TrainingEmployee();
        te.setTraining(training); te.setEmployee(employee); te.setNotaObtida(req.getNotaObtida()); te.setAprovado(req.getAprovado());
        return new TrainingEmployeeDTO(trainingEmployeeRepository.save(te));
    }
    @Transactional
    public TrainingEmployeeDTO updateEmployee(Long id, TrainingEmployeeRequestDTO req) {
        TrainingEmployee te = trainingEmployeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("TrainingEmployee not found"));
        te.setNotaObtida(req.getNotaObtida()); te.setAprovado(req.getAprovado());
        return new TrainingEmployeeDTO(trainingEmployeeRepository.save(te));
    }
    @Transactional(readOnly = true)
    public List<TrainingEmployeeDTO> getEmployees(Long trainingId) {
        return trainingEmployeeRepository.findByTrainingIdWithEmployee(trainingId).stream().map(TrainingEmployeeDTO::new).toList();
    }
    @Transactional(readOnly = true)
    public List<KanbanCompanyEntryDTO> getKanbanData(Long trailId) {
        Double notaMinima = certConfigRepository.findByTrailId(trailId)
                .map(c -> c.getNotaMinima()).orElse(null);

        List<KanbanCompanyEntryDTO> result = new ArrayList<>();

        // ── 1. Salas de treinamento vinculadas à trilha com empresa ──────────
        List<TrainingRoom> rooms = trainingRoomRepository.findByTrailIdWithCompany(trailId);
        for (TrainingRoom room : rooms) {
            KanbanCompanyEntryDTO entry = new KanbanCompanyEntryDTO();
            entry.setCompanyId(room.getCompany().getId());
            entry.setCompanyName(room.getCompany().getName());
            entry.setTrainingId(room.getId());
            entry.setDataInicio(null);
            entry.setDataConclusao(null);

            List<Employee> invitados = room.getInvitedEmployees();
            List<KanbanEmployeeEntryDTO> empDTOs = enrichEmployeeDTOs(invitados, trailId);
            entry.setFuncionarios(empDTOs);
            entry.setAprovado(false);

            // ── indicadores de conclusão e certificação por empresa ──
            entry.setAllCompleted(!empDTOs.isEmpty() && empDTOs.stream().allMatch(e -> Boolean.TRUE.equals(e.getCompletedTrail())));
            entry.setAnyCertified(empDTOs.stream().anyMatch(e -> Boolean.TRUE.equals(e.getCertifiedTrail())));
            result.add(entry);
        }

        // ── 2. Registros manuais de treinamento (Training table) ─────────────
        List<Training> trainings = trainingRepository.findByTrailIdWithCompany(trailId);
        for (Training t : trainings) {
            KanbanCompanyEntryDTO entry = new KanbanCompanyEntryDTO();
            entry.setCompanyId(t.getCompany().getId());
            entry.setCompanyName(t.getCompany().getName());
            entry.setTrainingId(t.getId());
            entry.setDataInicio(t.getDataInicio());
            entry.setDataConclusao(t.getDataConclusao());

            List<TrainingEmployee> employees = trainingEmployeeRepository.findByTrainingIdWithEmployee(t.getId());
            List<Employee> empList = employees.stream().map(TrainingEmployee::getEmployee).toList();
            List<KanbanEmployeeEntryDTO> empDTOs = enrichEmployeeDTOs(empList, trailId);

            // preserva nota/aprovação do training manual
            for (int i = 0; i < employees.size() && i < empDTOs.size(); i++) {
                empDTOs.get(i).setNotaObtida(employees.get(i).getNotaObtida());
                empDTOs.get(i).setAprovado(employees.get(i).getAprovado());
            }

            entry.setFuncionarios(empDTOs);
            boolean aprovadoEmpresa = !employees.isEmpty()
                    && notaMinima != null
                    && employees.stream().allMatch(te -> te.getAprovado() != null && te.getAprovado());
            entry.setAprovado(aprovadoEmpresa);
            entry.setAllCompleted(!empDTOs.isEmpty() && empDTOs.stream().allMatch(e -> Boolean.TRUE.equals(e.getCompletedTrail())));
            entry.setAnyCertified(empDTOs.stream().anyMatch(e -> Boolean.TRUE.equals(e.getCertifiedTrail())));
            result.add(entry);
        }

        return result;
    }

    /**
     * Para cada employee: verifica se ele tem um usuário vinculado e, se sim,
     * consulta o UserTrailProgress para saber se completou/foi certificado na trilha.
     */
    private List<KanbanEmployeeEntryDTO> enrichEmployeeDTOs(
            List<Employee> employees, Long trailId
    ) {
        try {
            // Coleta user IDs dos funcionários que têm usuário vinculado
            List<Long> userIds = employees.stream()
                    .filter(e -> e.getUser() != null)
                    .map(e -> e.getUser().getId())
                    .toList();

            // Evita query com lista vazia (IN () é SQL inválido)
            java.util.Map<Long, com.system.UDoc.entity.UserTrailProgress> progressByUserId =
                    userIds.isEmpty()
                    ? java.util.Collections.emptyMap()
                    : progressRepository.findByUserIdInAndTrailId(userIds, trailId)
                            .stream()
                            .collect(java.util.stream.Collectors.toMap(
                                    p -> p.getUser().getId(), p -> p,
                                    (a, b) -> a)); // evita duplicatas

            return employees.stream().map(emp -> {
                KanbanEmployeeEntryDTO dto = new KanbanEmployeeEntryDTO(
                        emp.getId(), emp.getName(), null, false);

                if (emp.getUser() != null) {
                    var progress = progressByUserId.get(emp.getUser().getId());
                    if (progress != null) {
                        dto.setCompletedTrail("completed".equals(progress.getStatus()));
                        dto.setCertifiedTrail(Boolean.TRUE.equals(progress.getCertified()));
                    }
                }
                return dto;
            }).toList();

        } catch (Exception ex) {
            // Fallback seguro: retorna sem dados de progresso em vez de propagar o erro
            return employees.stream()
                    .map(e -> new KanbanEmployeeEntryDTO(e.getId(), e.getName(), null, false))
                    .toList();
        }
    }
}
