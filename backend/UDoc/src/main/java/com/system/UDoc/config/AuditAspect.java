package com.system.UDoc.config;

import com.system.UDoc.entity.*;
import com.system.UDoc.entity.AuditLog;
import com.system.UDoc.repository.AuditLogRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Intercepta CRUD em todos os *Service e registra no audit_log
 * com módulo, ação, alvo (id + nome da entidade) e usuário logado.
 */
@Aspect
@Component
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditLogRepository auditLogRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // Mapeamento: nome do módulo → classe da entidade (para busca antes de delete)
    private static final Map<String, Class<?>> ENTITY_CLASS = Map.of(
        "CARD",         Card.class,
        "COMPANY",      Company.class,
        "EMPLOYEE",     Employee.class,
        "ISM",          Ism.class,
        "TRAIL",        Trail.class,
        "USER",         User.class,
        "TRAINING",     Training.class,
        "TRAININGROOM", TrainingRoom.class
    );

    public AuditAspect(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Around(
        "execution(* com.system.UDoc.service.*Service.create*(..)) ||" +
        "execution(* com.system.UDoc.service.*Service.update*(..)) ||" +
        "execution(* com.system.UDoc.service.*Service.delete*(..)) ||" +
        "execution(* com.system.UDoc.service.*Service.clone*(..))  ||" +
        "execution(* com.system.UDoc.service.*Service.add*(..))    ||" +
        "execution(* com.system.UDoc.service.*Service.remove*(..))"
    )
    public Object aroundCrud(ProceedingJoinPoint pjp) throws Throwable {

        String methodName = pjp.getSignature().getName();
        String action     = resolveAction(methodName);

        // Se não é uma ação de auditoria, só executa sem interceptar
        if (action == null) return pjp.proceed();

        String module      = resolveModule(pjp);
        String performedBy = resolveUser();

        // Para DELETE: captura o nome da entidade ANTES de excluir
        String preDeleteName = null;
        if ("DELETED".equals(action)) {
            preDeleteName = lookupEntityName(module, pjp.getArgs());
        }

        // Executa o método original
        Object result = pjp.proceed();

        // Nome da entidade: para create/update vem do resultado; para delete veio antes
        String name   = preDeleteName != null ? preDeleteName : extractName(result);
        Long   id     = extractId(pjp.getArgs(), result);
        String target = buildTarget(module, id, name);

        try {
            auditLogRepository.save(new AuditLog(module, action, target, performedBy, null));
        } catch (Exception e) {
            log.warn("AuditAspect: falha ao salvar audit_log — {}", e.getMessage());
        }

        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveAction(String method) {
        String m = method.toLowerCase();
        if (m.startsWith("create") || m.startsWith("add") || m.startsWith("clone") || m.startsWith("register")) return "CREATED";
        if (m.startsWith("update") || m.startsWith("save")) return "UPDATED";
        if (m.startsWith("delete") || m.startsWith("remove"))                                                     return "DELETED";
        return null;
    }

    private String resolveModule(ProceedingJoinPoint pjp) {
        String name = pjp.getTarget().getClass().getSimpleName();
        int dollar = name.indexOf('$');
        if (dollar > 0) name = name.substring(0, dollar);
        return name.replace("Service", "").toUpperCase();
    }

    private String resolveUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "system";
    }

    /** Busca o nome/título da entidade no banco ANTES de deletar */
    private String lookupEntityName(String module, Object[] args) {
        Long id = firstLong(args);
        if (id == null) return null;
        Class<?> entityClass = ENTITY_CLASS.get(module);
        if (entityClass == null) return null;
        try {
            Object entity = entityManager.find(entityClass, id);
            if (entity == null) return null;
            return extractName(entity);
        } catch (Exception e) {
            return null;
        }
    }

    /** Extrai nome/título do objeto (DTO ou entidade) via reflexão */
    private String extractName(Object obj) {
        if (obj == null) return null;
        for (String getter : new String[]{"getTitle", "getName", "getEmail", "getFilename"}) {
            try {
                Object val = obj.getClass().getMethod(getter).invoke(obj);
                if (val instanceof String s && !s.isBlank()) return s;
            } catch (Exception ignored) {}
        }
        return null;
    }

    /** Extrai o ID: primeiro tenta o resultado (create), depois os args (delete/update) */
    private Long extractId(Object[] args, Object result) {
        if (result != null) {
            try {
                Object id = result.getClass().getMethod("getId").invoke(result);
                if (id instanceof Long l) return l;
                if (id instanceof Integer i) return (long) i;
            } catch (Exception ignored) {}
        }
        return firstLong(args);
    }

    private Long firstLong(Object[] args) {
        if (args == null) return null;
        for (Object a : args) {
            if (a instanceof Long l)    return l;
            if (a instanceof Integer i) return (long) i;
        }
        return null;
    }

    private String buildTarget(String module, Long id, String name) {
        String base = module.toLowerCase() + (id != null ? "#" + id : "");
        return name != null ? base + " — " + name : base;
    }
}
