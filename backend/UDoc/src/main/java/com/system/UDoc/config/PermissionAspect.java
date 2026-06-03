package com.system.UDoc.config;

import com.system.UDoc.entity.PermissionGroup.GroupType;
import com.system.UDoc.service.PermissionService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Verifica permissões configuráveis antes de executar operações de CREATE/EDIT/DELETE.
 * VIEW é verificado apenas no frontend (UX); CREATE/EDIT/DELETE são verificados aqui (segurança).
 *
 * NUNCA substitui regras fixas já existentes — é uma camada ADICIONAL.
 * ADMIN bypassa todas as verificações desta camada.
 */
@Aspect
@Component
public class PermissionAspect {

    private static final Logger log = LoggerFactory.getLogger(PermissionAspect.class);

    // Mapeamento: nome do service (sem sufixo "Service") → módulo de permissão
    private static final Map<String, String> SERVICE_TO_MODULE = Map.of(
        "CARD",         "CARD",
        "TRAIL",        "TRILHA",
        "TRAININGROOM", "SALA",
        "EMPLOYEE",     "FUNCIONARIO",
        "COMPANY",      "EMPRESA",
        "ISM",          "ISM",
        "USER",         "USUARIO",
        "TRAINING",     "TRAINING"
    );

    private final PermissionService permissionService;

    public PermissionAspect(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @Around(
        "execution(* com.system.UDoc.service.CardService.create*(..))"         +
        " || execution(* com.system.UDoc.service.CardService.update*(..))"     +
        " || execution(* com.system.UDoc.service.CardService.delete*(..))"     +
        " || execution(* com.system.UDoc.service.TrailService.create*(..))"    +
        " || execution(* com.system.UDoc.service.TrailService.update*(..))"    +
        " || execution(* com.system.UDoc.service.TrailService.delete*(..))"    +
        " || execution(* com.system.UDoc.service.TrainingRoomService.create*(..))" +
        " || execution(* com.system.UDoc.service.TrainingRoomService.update*(..))" +
        " || execution(* com.system.UDoc.service.TrainingRoomService.delete*(..))" +
        " || execution(* com.system.UDoc.service.EmployeeService.create*(..))" +
        " || execution(* com.system.UDoc.service.EmployeeService.update*(..))" +
        " || execution(* com.system.UDoc.service.EmployeeService.delete*(..))" +
        " || execution(* com.system.UDoc.service.CompanyService.create*(..))"  +
        " || execution(* com.system.UDoc.service.CompanyService.update*(..))"  +
        " || execution(* com.system.UDoc.service.CompanyService.delete*(..))"  +
        " || execution(* com.system.UDoc.service.IsmService.create*(..))"      +
        " || execution(* com.system.UDoc.service.IsmService.update*(..))"      +
        " || execution(* com.system.UDoc.service.IsmService.delete*(..))"      +
        " || execution(* com.system.UDoc.service.UserService.create*(..))"     +
        " || execution(* com.system.UDoc.service.UserService.update*(..))"     +
        " || execution(* com.system.UDoc.service.UserService.delete*(..))"
    )
    public Object checkPermission(ProceedingJoinPoint pjp) throws Throwable {

        try {
            // ADMIN bypassa — resolveCurrentUserGroup() retorna null para ADMIN
            GroupType groupType = permissionService.resolveCurrentUserGroup();
            if (groupType == null) return pjp.proceed(); // ADMIN

            String module = resolveModule(pjp);
            String action = resolveAction(pjp.getSignature().getName());

            if (module == null || action == null) return pjp.proceed();

            if (!permissionService.hasPermission(groupType, module, action)) {
                log.info("PermissionAspect: acesso negado — grupo={} módulo={} ação={}",
                         groupType, module, action);
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Permissão negada: " + groupType + " não pode " + action + " em " + module);
            }
        } catch (ResponseStatusException e) {
            throw e; // repropaga 403
        } catch (Exception e) {
            log.warn("PermissionAspect: erro ao verificar permissão — {}", e.getMessage());
            // Em caso de falha inesperada, permite a operação (fail-open para não bloquear sistema)
        }

        return pjp.proceed();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveModule(ProceedingJoinPoint pjp) {
        String name = pjp.getTarget().getClass().getSimpleName();
        int dollar = name.indexOf('$');
        if (dollar > 0) name = name.substring(0, dollar);
        return SERVICE_TO_MODULE.get(name.replace("Service", "").toUpperCase());
    }

    private String resolveAction(String methodName) {
        String m = methodName.toLowerCase();
        if (m.startsWith("create") || m.startsWith("add") || m.startsWith("clone")) return "CREATE";
        if (m.startsWith("update") || m.startsWith("save"))                          return "EDIT";
        if (m.startsWith("delete") || m.startsWith("remove"))                        return "DELETE";
        return null;
    }
}
