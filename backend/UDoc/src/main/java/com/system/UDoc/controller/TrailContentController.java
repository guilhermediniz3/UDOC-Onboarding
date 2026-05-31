package com.system.UDoc.controller;
import com.system.UDoc.dto.TrailContentDTO;
import com.system.UDoc.dto.TrailContentRequestDTO;
import com.system.UDoc.service.TrailContentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
public class TrailContentController {
    private final TrailContentService service;
    public TrailContentController(TrailContentService service) { this.service = service; }
    @GetMapping("/trails/{trailId}/content")
    public ResponseEntity<List<TrailContentDTO>> getContent(@PathVariable Long trailId) {
        return ResponseEntity.ok(service.getContent(trailId));
    }
    @PutMapping("/trails/{trailId}/content")
    public ResponseEntity<List<TrailContentDTO>> replaceContent(@PathVariable Long trailId, @RequestBody List<TrailContentRequestDTO> items) {
        return ResponseEntity.ok(service.replaceContent(trailId, items));
    }
}
