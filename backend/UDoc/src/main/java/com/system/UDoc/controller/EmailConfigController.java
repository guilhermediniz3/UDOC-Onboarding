package com.system.UDoc.controller;

import com.system.UDoc.dto.EmailConfigDTO;
import com.system.UDoc.dto.EmailConfigRequestDTO;
import com.system.UDoc.service.EmailConfigService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/email-config")
public class EmailConfigController {

    private final EmailConfigService emailConfigService;

    public EmailConfigController(EmailConfigService emailConfigService) {
        this.emailConfigService = emailConfigService;
    }

    @GetMapping
    public ResponseEntity<EmailConfigDTO> getConfig() {
        return ResponseEntity.ok(emailConfigService.getConfig());
    }

    @PostMapping
    public ResponseEntity<EmailConfigDTO> saveConfig(
            @Valid @RequestBody EmailConfigRequestDTO request
    ) {
        return ResponseEntity.ok(emailConfigService.saveConfig(request));
    }
}
