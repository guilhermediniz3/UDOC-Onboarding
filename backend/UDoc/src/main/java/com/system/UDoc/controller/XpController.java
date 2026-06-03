package com.system.UDoc.controller;

import com.system.UDoc.entity.User;
import com.system.UDoc.service.XpService;
import com.system.UDoc.service.XpService.XpSummary;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/xp")
public class XpController {

    private final XpService xpService;

    public XpController(XpService xpService) {
        this.xpService = xpService;
    }

    /** Retorna XP total, nível, ícone e progresso do usuário logado */
    @GetMapping("/me")
    public ResponseEntity<XpSummary> mySummary(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(xpService.getSummary(user.getId()));
    }

    /** Retorna XP de qualquer usuário (uso admin/ranking) */
    @GetMapping("/{userId}")
    public ResponseEntity<XpSummary> summary(@PathVariable Long userId) {
        return ResponseEntity.ok(xpService.getSummary(userId));
    }
}
