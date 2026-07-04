package com.system.UDoc.controller;

import com.system.UDoc.dto.TranscricaoTrechoDTO;
import com.system.UDoc.dto.TranscricaoTrechoRequestDTO;
import com.system.UDoc.entity.User;
import com.system.UDoc.service.TranscricaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transcricao")
public class TranscricaoController {

    private final TranscricaoService transcricaoService;

    public TranscricaoController(TranscricaoService transcricaoService) {
        this.transcricaoService = transcricaoService;
    }

    @PostMapping
    public ResponseEntity<TranscricaoTrechoDTO> salvarTrecho(
            @RequestBody TranscricaoTrechoRequestDTO req,
            @AuthenticationPrincipal User usuario) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transcricaoService.salvarTrecho(req, usuario));
    }

    @GetMapping("/sala/{trainingRoomId}")
    public ResponseEntity<List<TranscricaoTrechoDTO>> listarPorSala(
            @PathVariable Long trainingRoomId) {
        return ResponseEntity.ok(transcricaoService.listarPorSala(trainingRoomId));
    }
}
