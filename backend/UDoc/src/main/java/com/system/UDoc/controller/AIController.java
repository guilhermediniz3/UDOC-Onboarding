package com.system.UDoc.controller;
import com.system.UDoc.dto.AIRequestDTO;
import com.system.UDoc.dto.AIResponseDTO;
import com.system.UDoc.service.AIService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/generate")
    public ResponseEntity<AIResponseDTO> generate(
            @RequestBody AIRequestDTO request
    ) {
        AIResponseDTO response =
                aiService.generate(request.prompt());

        return ResponseEntity.ok(response);
    }
}