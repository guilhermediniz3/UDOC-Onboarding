package com.system.UDoc.controller;
import com.system.UDoc.dto.*;
import com.system.UDoc.service.TrailCertificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
public class TrailCertificationController {
    private final TrailCertificationService service;
    public TrailCertificationController(TrailCertificationService service) { this.service = service; }
    @GetMapping("/trails/{trailId}/certification")
    public ResponseEntity<TrailCertificationConfigDTO> getConfig(@PathVariable Long trailId) {
        return ResponseEntity.ok(service.getConfig(trailId));
    }
    @PostMapping("/trails/{trailId}/certification/config")
    public ResponseEntity<TrailCertificationConfigDTO> saveConfig(@PathVariable Long trailId, @Valid @RequestBody TrailCertificationConfigRequestDTO req) {
        return ResponseEntity.ok(service.saveConfig(trailId, req.getNotaMinima()));
    }
    @GetMapping("/trails/{trailId}/questions")
    public ResponseEntity<List<TrailQuestionDTO>> getQuestions(@PathVariable Long trailId) {
        return ResponseEntity.ok(service.getQuestions(trailId));
    }
    @PutMapping("/trails/{trailId}/questions")
    public ResponseEntity<List<TrailQuestionDTO>> replaceQuestions(@PathVariable Long trailId, @RequestBody List<TrailQuestionRequestDTO> questions) {
        return ResponseEntity.ok(service.replaceQuestions(trailId, questions));
    }
    @PostMapping("/trails/{trailId}/questions/generate")
    public ResponseEntity<List<TrailQuestionDTO>> generateWithGroq(@PathVariable Long trailId) {
        return ResponseEntity.ok(service.generateQuestionsWithGroq(trailId));
    }
}
