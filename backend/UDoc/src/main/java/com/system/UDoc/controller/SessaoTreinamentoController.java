package com.system.UDoc.controller;

import com.system.UDoc.dto.CriarSessaoRequestDTO;
import com.system.UDoc.dto.SessaoTreinamentoDTO;
import com.system.UDoc.entity.User;
import com.system.UDoc.service.SessaoTreinamentoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sessao-treinamento")
public class SessaoTreinamentoController {

    private final SessaoTreinamentoService sessaoService;

    public SessaoTreinamentoController(SessaoTreinamentoService sessaoService) {
        this.sessaoService = sessaoService;
    }

    @PostMapping
    public ResponseEntity<SessaoTreinamentoDTO> criar(
            @RequestBody CriarSessaoRequestDTO req,
            @AuthenticationPrincipal User usuario) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessaoService.criarSessao(req.trainingRoomId(), req.modoCaptura(), usuario));
    }

    @PostMapping("/{id}/encerrar")
    public ResponseEntity<SessaoTreinamentoDTO> encerrar(
            @PathVariable Long id,
            @AuthenticationPrincipal User usuario) {
        return ResponseEntity.ok(sessaoService.encerrarSessao(id, usuario));
    }

    @GetMapping("/sala/{roomId}")
    public ResponseEntity<List<SessaoTreinamentoDTO>> listarPorSala(
            @PathVariable Long roomId) {
        return ResponseEntity.ok(sessaoService.listarPorSala(roomId));
    }
}
