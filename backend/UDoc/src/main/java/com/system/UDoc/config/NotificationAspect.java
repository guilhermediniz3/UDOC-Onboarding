package com.system.UDoc.config;

import com.system.UDoc.entity.Notification.NotifType;
import com.system.UDoc.service.NotificationService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Gera notificações automáticas ao criar/editar cards e trilhas.
 * Regra 7.4: funcionários externos não recebem notificações de cards internos.
 */
@Aspect
@Component
public class NotificationAspect {

    private static final Logger log = LoggerFactory.getLogger(NotificationAspect.class);

    private final NotificationService notificationService;

    public NotificationAspect(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ── Cards ─────────────────────────────────────────────────────────────────

    @AfterReturning(
        pointcut  = "execution(* com.system.UDoc.service.CardService.createCard(..))",
        returning = "result"
    )
    public void onCardCreated(Object result) {
        try {
            String  title    = (String) invoke(result, "getTitle");
            Long    id       = (Long)   invoke(result, "getId");
            Boolean interno  = (Boolean) invoke(result, "getInterno");
            if (title == null) return;
            notificationService.notify(NotifType.CARD_CREATED,
                "Novo card: " + title, id, Boolean.TRUE.equals(interno));
        } catch (Exception e) {
            log.warn("NotificationAspect.onCardCreated: {}", e.getMessage());
        }
    }

    @AfterReturning(
        pointcut  = "execution(* com.system.UDoc.service.CardService.updateCard(..))",
        returning = "result"
    )
    public void onCardUpdated(Object result) {
        try {
            String  title   = (String)  invoke(result, "getTitle");
            Long    id      = (Long)    invoke(result, "getId");
            Boolean interno = (Boolean) invoke(result, "getInterno");
            if (title == null) return;
            notificationService.notify(NotifType.CARD_UPDATED,
                "Card atualizado: " + title, id, Boolean.TRUE.equals(interno));
        } catch (Exception e) {
            log.warn("NotificationAspect.onCardUpdated: {}", e.getMessage());
        }
    }

    // ── Trilhas ───────────────────────────────────────────────────────────────

    @AfterReturning(
        pointcut  = "execution(* com.system.UDoc.service.TrailService.createTrail(..))",
        returning = "result"
    )
    public void onTrailCreated(Object result) {
        try {
            String name = (String) invoke(result, "getName");
            Long   id   = (Long)   invoke(result, "getId");
            if (name == null) return;
            notificationService.notify(NotifType.TRAIL_CREATED,
                "Nova trilha: " + name, id, false);
        } catch (Exception e) {
            log.warn("NotificationAspect.onTrailCreated: {}", e.getMessage());
        }
    }

    @AfterReturning(
        pointcut  = "execution(* com.system.UDoc.service.TrailService.updateTrail(..))",
        returning = "result"
    )
    public void onTrailUpdated(Object result) {
        try {
            String name = (String) invoke(result, "getName");
            Long   id   = (Long)   invoke(result, "getId");
            if (name == null) return;
            notificationService.notify(NotifType.TRAIL_UPDATED,
                "Trilha atualizada: " + name, id, false);
        } catch (Exception e) {
            log.warn("NotificationAspect.onTrailUpdated: {}", e.getMessage());
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Object invoke(Object obj, String method) {
        if (obj == null) return null;
        try { return obj.getClass().getMethod(method).invoke(obj); }
        catch (Exception e) { return null; }
    }
}
