package com.system.UDoc.controller;

import com.system.UDoc.dto.GerarRatRequestDTO;
import com.system.UDoc.dto.RatDTO;
import com.system.UDoc.dto.RatRequestDTO;
import com.system.UDoc.entity.User;
import com.system.UDoc.service.RatService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/rat")
public class RatController {

    private final RatService ratService;

    public RatController(RatService ratService) {
        this.ratService = ratService;
    }

    @PostMapping
    public ResponseEntity<RatDTO> salvar(
            @RequestBody RatRequestDTO req,
            @AuthenticationPrincipal User autor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ratService.salvar(req, autor));
    }

    @GetMapping
    public ResponseEntity<Page<RatDTO>> listar(
            @RequestParam(required = false) Long ismId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long autorId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            Pageable pageable) {
        return ResponseEntity.ok(ratService.listar(ismId, companyId, autorId, dataInicio, dataFim, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RatDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ratService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RatDTO> atualizar(
            @PathVariable Long id,
            @RequestBody RatRequestDTO req,
            @AuthenticationPrincipal User autor) {
        return ResponseEntity.ok(ratService.atualizar(id, req, autor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long id,
            @AuthenticationPrincipal User autor) {
        ratService.deletar(id, autor);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/gerar-ia")
    public ResponseEntity<Map<String, String>> gerarComIA(
            @RequestBody GerarRatRequestDTO req,
            @AuthenticationPrincipal User autor) {
        String html = ratService.gerarComIA(req, autor);
        return ResponseEntity.ok(Map.of("content", html));
    }
}
