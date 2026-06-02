package com.system.UDoc.controller;
import com.system.UDoc.dto.*;
import com.system.UDoc.service.NpsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/nps")
public class NpsController {
    private final NpsService npsService;
    public NpsController(NpsService npsService) { this.npsService = npsService; }
    @GetMapping("/{refType}/{refId}/questions")
    public ResponseEntity<List<NpsQuestionDTO>> getQuestions(@PathVariable String refType, @PathVariable Long refId) {
        return ResponseEntity.ok(npsService.getQuestions(refType, refId));
    }
    @PutMapping("/{refType}/{refId}/questions")
    public ResponseEntity<List<NpsQuestionDTO>> replaceQuestions(@PathVariable String refType, @PathVariable Long refId, @RequestBody List<NpsQuestionRequestDTO> body) {
        return ResponseEntity.ok(npsService.replaceQuestions(refType, refId, body));
    }
    @PostMapping("/{refType}/{refId}/questions/generate")
    public ResponseEntity<List<NpsQuestionDTO>> generateNpsQuestionsWithGroq(
            @PathVariable String refType, @PathVariable Long refId) {
        return ResponseEntity.ok(npsService.generateNpsQuestionsWithGroq(refType, refId));
    }

    @GetMapping("/{refType}/{refId}/config")
    public ResponseEntity<java.util.Map<String, Boolean>> getNpsConfig(
            @PathVariable String refType, @PathVariable Long refId) {
        return ResponseEntity.ok(java.util.Map.of("enabled", npsService.isNpsEnabled(refType, refId)));
    }

    @PutMapping("/{refType}/{refId}/config")
    public ResponseEntity<java.util.Map<String, Boolean>> setNpsConfig(
            @PathVariable String refType, @PathVariable Long refId,
            @RequestBody java.util.Map<String, Boolean> body) {
        boolean enabled = npsService.setNpsEnabled(refType, refId, Boolean.TRUE.equals(body.get("enabled")));
        return ResponseEntity.ok(java.util.Map.of("enabled", enabled));
    }

    @PostMapping("/responses")
    public ResponseEntity<Void> submitResponse(@RequestBody NpsResponseRequestDTO body) {
        npsService.submitResponse(body); return ResponseEntity.ok().build();
    }
    @PostMapping("/cards/{id}/access")
    public ResponseEntity<Void> incrementAccess(@PathVariable Long id) {
        npsService.incrementCardAccess(id); return ResponseEntity.ok().build();
    }
    @GetMapping("/dashboard")
    public ResponseEntity<NpsDashboardDTO> getDashboard(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        return ResponseEntity.ok(npsService.getDashboard(startDate, endDate));
    }
}
