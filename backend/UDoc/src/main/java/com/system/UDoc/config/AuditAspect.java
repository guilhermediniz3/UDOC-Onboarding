package com.system.UDoc.config;

import com.system.UDoc.entity.AuditLog;
import com.system.UDoc.repository.AuditLogRepository;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Intercepta chamadas de CRUD em todos os services e registra automaticamente
 * no audit_log. Captura: create*, update*, delete*, clone*, add*, remove*
 */
@Aspect
@Component
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditLogRepository auditLogRepository;

    public AuditAspect(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @AfterReturning(
        pointcut = "execution(* com.system.UDoc.service.*Service.create*(..))" +
                   " || execution(* com.system.UDoc.service.*Service.update*(..))" +
                   " || execution(* com.system.UDoc.service.*Service.delete*(..))" +
                   " || execution(* com.system.UDoc.service.*Service.clone*(..))"  +
                   " || execution(* com.system.UDoc.service.*Service.add*(..))"    +
                   " || execution(* com.system.UDoc.service.*Service.remove*(..))",
        returning = "result"
    )
    public void afterCrud(JoinPoint jp, Object result) {
        try {
            String methodName = jp.getSignature().getName();
            String action     = resolveAction(methodName);
            if (action == null) return;

            String module      = resolveModule(jp);
            String performedBy = resolveUser();
            String target      = resolveTarget(module, jp.getArgs(), result);

            auditLogRepository.save(new AuditLog(module, action, target, performedBy, null));

        } catch (Exception e) {
            log.warn("AuditAspect: erro ao registrar audit_log — {}", e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveAction(String methodName) {
        String m = methodName.toLowerCase();
        if (m.startsWith("create") || m.startsWith("add") || m.startsWith("clone") || m.startsWith("register")) return "CREATED";
        if (m.startsWith("update") || m.startsWith("save"))                                                        return "UPDATED";
        if (m.startsWith("delete") || m.startsWith("remove"))                                                      return "DELETED";
        return null;
    }

    private String resolveModule(JoinPoint jp) {
        // Ex.: CardService → CARD, CompanyService → COMPANY
        String simpleName = jp.getTarget().getClass().getSimpleName();
        // Remove sufixos de proxy do Spring (ex: CardService$$SpringCGLIB$...)
        int dollar = simpleName.indexOf('$');
        if (dollar > 0) simpleName = simpleName.substring(0, dollar);
        return simpleName.replace("Service", "").toUpperCase();
    }

    private String resolveUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "system";
    }

    private String resolveTarget(String module, Object[] args, Object result) {
        // Tenta extrair ID do resultado (create retorna DTO com getId())
        if (result != null) {
            try {
                Object id = result.getClass().getMethod("getId").invoke(result);
                if (id != null) return module.toLowerCase() + "#" + id;
            } catch (Exception ignored) {}
        }
        // Fallback: usa o primeiro argumento Long como ID (delete/update)
        if (args != null) {
            for (Object arg : args) {
                if (arg instanceof Long) return module.toLowerCase() + "#" + arg;
                if (arg instanceof Integer) return module.toLowerCase() + "#" + arg;
            }
            // Último recurso: lista os args abreviados
            if (args.length > 0) return module.toLowerCase() + Arrays.toString(args);
        }
        return module.toLowerCase();
    }
}
