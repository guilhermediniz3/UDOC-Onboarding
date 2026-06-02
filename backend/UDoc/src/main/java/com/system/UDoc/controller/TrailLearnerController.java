package com.system.UDoc.controller;
import com.system.UDoc.dto.*;
import com.system.UDoc.entity.User;
import com.system.UDoc.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
public class TrailLearnerController {
    private final UserTrailProgressService progressService;
    private final CardQuizService cardQuizService;
    private final CertificateTemplateService certService;
    public TrailLearnerController(UserTrailProgressService progressService, CardQuizService cardQuizService, CertificateTemplateService certService) {
        this.progressService = progressService; this.cardQuizService = cardQuizService; this.certService = certService;
    }
    // ── Progresso ─────────────────────────────────────────────────────────────
    @GetMapping("/my-trails/{trailId}/progress")
    public ResponseEntity<UserTrailProgressDTO> getProgress(@AuthenticationPrincipal User user, @PathVariable Long trailId) {
        return ResponseEntity.ok(progressService.getProgress(user.getId(), trailId));
    }

    @PutMapping("/my-trails/{trailId}/progress")
    public ResponseEntity<UserTrailProgressDTO> saveProgress(@AuthenticationPrincipal User user, @PathVariable Long trailId, @Valid @RequestBody UserTrailProgressRequestDTO req) {
        return ResponseEntity.ok(progressService.saveProgress(user.getId(), trailId, req));
    }

    /** Acumula tempo de sessão — chamado a cada 30s e no beforeunload */
    @PutMapping("/my-trails/{trailId}/time")
    public ResponseEntity<Void> addTime(
            @AuthenticationPrincipal User user,
            @PathVariable Long trailId,
            @RequestBody java.util.Map<String, Long> body
    ) {
        long secs = body.getOrDefault("additionalSeconds", 0L);
        progressService.addTime(user.getId(), trailId, secs);
        return ResponseEntity.ok().build();
    }
    /** Lista todos os certificados obtidos pelo usuário logado */
    @GetMapping("/my-trails/certificates")
    public ResponseEntity<List<com.system.UDoc.dto.CertificateInfoDTO>> getMyCertificates(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(progressService.getMyCertificates(user.getId()));
    }

    // ── Quiz por Card (admin) ──────────────────────────────────────────────────
    @GetMapping("/cards/{cardId}/questions")
    public ResponseEntity<List<CardQuestionDTO>> getCardQuestions(@PathVariable Long cardId) {
        return ResponseEntity.ok(cardQuizService.getQuestions(cardId));
    }
    @PutMapping("/cards/{cardId}/questions")
    public ResponseEntity<List<CardQuestionDTO>> replaceCardQuestions(@PathVariable Long cardId, @RequestBody List<CardQuestionRequestDTO> questions) {
        return ResponseEntity.ok(cardQuizService.replaceQuestions(cardId, questions));
    }

    @PostMapping("/cards/{cardId}/questions/generate")
    public ResponseEntity<List<CardQuestionDTO>> generateCardQuestionsWithGroq(@PathVariable Long cardId) {
        return ResponseEntity.ok(cardQuizService.generateQuestionsWithGroq(cardId));
    }
    // ── Template de Certificado ────────────────────────────────────────────────
    @GetMapping("/certificate-template")
    public ResponseEntity<CertificateTemplateDTO> getTemplate() {
        return ResponseEntity.ok(certService.getTemplate());
    }
    @PostMapping("/certificate-template")
    public ResponseEntity<CertificateTemplateDTO> saveTemplate(@RequestBody CertificateTemplateDTO req) {
        return ResponseEntity.ok(certService.saveTemplate(req));
    }
}
