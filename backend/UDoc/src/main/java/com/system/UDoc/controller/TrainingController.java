package com.system.UDoc.controller;
import com.system.UDoc.dto.*;
import com.system.UDoc.service.TrainingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/trainings")
public class TrainingController {
    private final TrainingService service;
    public TrainingController(TrainingService service) { this.service = service; }
    @PostMapping
    public ResponseEntity<TrainingDTO> createTraining(@Valid @RequestBody TrainingRequestDTO req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createTraining(req));
    }
    @GetMapping("/trail/{trailId}")
    public ResponseEntity<List<TrainingDTO>> getTrainingsForTrail(@PathVariable Long trailId) {
        return ResponseEntity.ok(service.getTrainingsForTrail(trailId));
    }
    @GetMapping("/trail/{trailId}/kanban-data")
    public ResponseEntity<List<KanbanCompanyEntryDTO>> getKanbanData(@PathVariable Long trailId) {
        return ResponseEntity.ok(service.getKanbanData(trailId));
    }
    @PostMapping("/{id}/employees")
    public ResponseEntity<TrainingEmployeeDTO> addEmployee(@PathVariable Long id, @Valid @RequestBody TrainingEmployeeRequestDTO req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addEmployee(id, req));
    }
    @PutMapping("/employees/{id}")
    public ResponseEntity<TrainingEmployeeDTO> updateEmployee(@PathVariable Long id, @Valid @RequestBody TrainingEmployeeRequestDTO req) {
        return ResponseEntity.ok(service.updateEmployee(id, req));
    }
    @GetMapping("/{id}/employees")
    public ResponseEntity<List<TrainingEmployeeDTO>> getEmployees(@PathVariable Long id) {
        return ResponseEntity.ok(service.getEmployees(id));
    }
}
