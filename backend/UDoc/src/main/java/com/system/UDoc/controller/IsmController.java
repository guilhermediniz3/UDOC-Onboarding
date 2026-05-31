package com.system.UDoc.controller;

import com.system.UDoc.dto.IsmDTO;
import com.system.UDoc.dto.IsmRequestDTO;
import com.system.UDoc.service.IsmService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ismsApi")
public class IsmController {

    private final IsmService ismService;

    public IsmController(IsmService ismService) {
        this.ismService = ismService;
    }

    @PostMapping
    public ResponseEntity<IsmDTO> createIsm(
            @Valid @RequestBody IsmRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ismService.createIsm(request));
    }

    @GetMapping
    public ResponseEntity<Page<IsmDTO>> getAllIsms(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ismService.getAllIsms(search, active, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IsmDTO> getIsmById(@PathVariable Long id) {
        return ResponseEntity.ok(ismService.getIsmById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IsmDTO> updateIsm(
            @PathVariable Long id,
            @Valid @RequestBody IsmRequestDTO request
    ) {
        return ResponseEntity.ok(ismService.updateIsm(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIsm(@PathVariable Long id) {
        ismService.deleteIsm(id);
        return ResponseEntity.noContent().build();
    }
}
