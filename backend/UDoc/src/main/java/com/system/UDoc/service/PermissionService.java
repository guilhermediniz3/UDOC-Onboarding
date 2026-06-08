package com.system.UDoc.service;

import com.system.UDoc.entity.Permission;
import com.system.UDoc.entity.PermissionGroup.GroupType;
import com.system.UDoc.entity.Role;
import com.system.UDoc.repository.EmployeeRepository;
import com.system.UDoc.repository.PermissionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PermissionService {

    private final PermissionRepository permRepo;
    private final EmployeeRepository   employeeRepo;

    public PermissionService(PermissionRepository permRepo,
                             EmployeeRepository   employeeRepo) {
        this.permRepo     = permRepo;
        this.employeeRepo = employeeRepo;
    }

    // ── Verificação em runtime ────────────────────────────────────────────────

    /**
     * Verifica se o grupo tem a permissão concedida.
     * ADMIN sempre retorna true — bypassa todas as verificações.
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(GroupType groupType, String module, String action) {
        return permRepo.findByGroupTypeModuleAction(groupType, module, action)
                       .map(Permission::getGranted)
                       .orElse(true); // se não cadastrado ainda, assume concedido
    }

    /**
     * Determina o GroupType do usuário logado a partir de role + employee.tipo.
     * Retorna null para ADMIN (bypassa verificações).
     */
    public GroupType resolveCurrentUserGroup() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;

        // Obtém role do principal (User implementa UserDetails)
        String roleName = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("");

        if ("ADMIN".equals(roleName)) return null; // ADMIN bypassa

        if ("ISM".equals(roleName)) return GroupType.ISM;

        if ("GESTOR".equals(roleName)) return GroupType.GESTOR;

        if ("FUNCIONARIO_EXTERNO".equals(roleName)) {
            // Distingue INTERNO vs EXTERNO pelo employee.tipo
            try {
                // Carrega o userId a partir do principal
                Object principal = auth.getPrincipal();
                Long userId = (Long) principal.getClass().getMethod("getId").invoke(principal);
                return employeeRepo.findByUserId(userId)
                        .map(emp -> "INTERNO".equals(emp.getTipo())
                                    ? GroupType.FUNCIONARIO_INTERNO
                                    : GroupType.FUNCIONARIO_EXTERNO)
                        .orElse(GroupType.FUNCIONARIO_EXTERNO);
            } catch (Exception e) {
                return GroupType.FUNCIONARIO_EXTERNO;
            }
        }
        return null;
    }

    // ── Endpoints da tela de admin ────────────────────────────────────────────

    /**
     * Retorna todas as permissões agrupadas por módulo → grupo → ação.
     * Formato: Map< module, Map< groupType, Map< action, {granted, sensitive} > > >
     */
    @Transactional(readOnly = true)
    public List<PermissionDTO> getAll() {
        return permRepo.findAllByOrderByModuleAscActionAsc()
                       .stream()
                       .map(PermissionDTO::from)
                       .toList();
    }

    /**
     * Retorna as permissões do usuário logado agrupadas por módulo.
     * Map< module, Map< action, Boolean > >
     */
    @Transactional(readOnly = true)
    public Map<String, Map<String, Boolean>> getMyPermissions() {
        GroupType groupType = resolveCurrentUserGroup();
        if (groupType == null) {
            // ADMIN: tudo concedido
            return java.util.Collections.emptyMap();
        }
        List<Permission> perms = permRepo.findByGroupGroupType(groupType);
        Map<String, Map<String, Boolean>> result = new LinkedHashMap<>();
        for (Permission p : perms) {
            result.computeIfAbsent(p.getModule(), k -> new LinkedHashMap<>())
                  .put(p.getAction(), Boolean.TRUE.equals(p.getGranted()));
        }
        return result;
    }

    /** Atualiza apenas o campo granted das permissões recebidas. */
    @Transactional
    public void updatePermissions(List<PermissionUpdateDTO> updates) {
        for (PermissionUpdateDTO u : updates) {
            permRepo.findById(u.id()).ifPresent(p -> p.setGranted(u.granted()));
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record PermissionDTO(
        Long    id,
        String  groupType,
        String  module,
        String  action,
        boolean granted,
        boolean sensitive,
        String  description
    ) {
        static PermissionDTO from(Permission p) {
            return new PermissionDTO(
                p.getId(),
                p.getGroupType().name(),
                p.getModule(),
                p.getAction(),
                Boolean.TRUE.equals(p.getGranted()),
                Boolean.TRUE.equals(p.getSensitive()),
                p.getDescription()
            );
        }
    }

    public record PermissionUpdateDTO(Long id, boolean granted) {}
}
