package com.system.UDoc.controller;

import com.system.UDoc.entity.User;
import com.system.UDoc.service.CatalogService;
import com.system.UDoc.service.CatalogService.CatalogTrailDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Catálogo de trilhas — matrícula livre para todos os perfis.
 * GET  /catalog          → lista trilhas disponíveis (filtradas por perfil/visibilidade)
 * POST /catalog/{id}/enroll → matricula o usuário na trilha
 */
@RestController
@RequestMapping("/catalog")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public ResponseEntity<List<CatalogTrailDTO>> getCatalog(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(catalogService.getCatalog(user, search));
    }

    @PostMapping("/{trailId}/enroll")
    public ResponseEntity<Void> enroll(
            @PathVariable Long trailId,
            @AuthenticationPrincipal User user) {
        catalogService.enroll(user, trailId);
        return ResponseEntity.noContent().build();
    }
}
