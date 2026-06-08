package com.system.UDoc.controller;

import com.system.UDoc.service.PermissionService;
import com.system.UDoc.service.PermissionService.PermissionDTO;
import com.system.UDoc.service.PermissionService.PermissionUpdateDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    /** Admin: lista todas as permissões para a tela de configuração */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','GESTOR')")
    public ResponseEntity<List<PermissionDTO>> getAll() {
        return ResponseEntity.ok(permissionService.getAll());
    }

    /** Admin: salva alterações de granted */
    @PutMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','GESTOR')")
    public ResponseEntity<Void> update(@RequestBody List<PermissionUpdateDTO> updates) {
        permissionService.updatePermissions(updates);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retorna as permissões do usuário logado (para controle de UX no frontend).
     * ADMIN recebe mapa vazio (frontend interpreta como "tudo concedido").
     */
    @GetMapping("/my")
    public ResponseEntity<Map<String, Map<String, Boolean>>> myPermissions() {
        return ResponseEntity.ok(permissionService.getMyPermissions());
    }
}
