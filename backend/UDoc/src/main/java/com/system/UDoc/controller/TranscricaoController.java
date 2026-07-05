package com.system.UDoc.controller;

import com.system.UDoc.dto.TranscricaoAcessoDTO;
import com.system.UDoc.dto.TranscricaoTrechoDTO;
import com.system.UDoc.dto.TranscricaoTrechoRequestDTO;
import com.system.UDoc.entity.User;
import com.system.UDoc.service.TranscricaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    @GetMapping("/sessao/{sessaoId}")
    public ResponseEntity<List<TranscricaoTrechoDTO>> listarPorSessao(
            @PathVariable Long sessaoId) {
        return ResponseEntity.ok(transcricaoService.listarPorSessao(sessaoId));
    }

    @PostMapping("/sessao/{sessaoId}/acesso")
    public ResponseEntity<Void> registrarAcesso(
            @PathVariable Long sessaoId,
            @RequestBody TranscricaoAcessoDTO req,
            @AuthenticationPrincipal User usuario) {
        transcricaoService.registrarAcesso(sessaoId, req.ratId(), req.acao(), usuario);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sessao/{sessaoId}/audio")
    public ResponseEntity<TranscricaoTrechoDTO> processarAudio(
            @PathVariable Long sessaoId,
            @RequestParam("trainingRoomId") Long trainingRoomId,
            @RequestParam("audio") MultipartFile audio,
            @AuthenticationPrincipal User usuario) throws IOException {
        TranscricaoTrechoDTO trecho = transcricaoService.processarAudioChunk(trainingRoomId, sessaoId, audio, usuario);
        if (trecho == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(trecho);
    }
}
