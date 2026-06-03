package com.system.UDoc.controller;

import com.system.UDoc.entity.User;
import com.system.UDoc.service.XpService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ranking")
public class RankingController {

    private final XpService xpService;

    public RankingController(XpService xpService) {
        this.xpService = xpService;
    }

    /**
     * Ranking de funcionários INTERNOS — visível para ADMIN e FUNCIONÁRIOS INTERNOS.
     * Retorna posição, nome, foto, XP total, nível e trilhas concluídas.
     */
    @GetMapping("/interno")
    public ResponseEntity<List<Map<String, Object>>> rankingInterno() {
        return ResponseEntity.ok(xpService.rankingInterno());
    }

    /**
     * Ranking de funcionários EXTERNOS da mesma empresa do usuário logado.
     * Nunca expõe funcionários de outras empresas.
     */
    @GetMapping("/externo")
    public ResponseEntity<List<Map<String, Object>>> rankingExterno(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(xpService.rankingExterno(user.getId()));
    }
}
