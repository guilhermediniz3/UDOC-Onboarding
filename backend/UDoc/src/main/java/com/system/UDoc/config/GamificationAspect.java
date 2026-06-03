package com.system.UDoc.config;

import com.system.UDoc.entity.UserXpEvent.EventType;
import com.system.UDoc.service.XpService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Dispara eventos de XP nos pontos corretos do sistema:
 *
 *  DAILY_ACCESS       → AuthService.login()
 *  TRAIL_COMPLETED    → UserTrailProgressService.saveProgress() quando status=completed
 *  CERTIFICATE_ISSUED → UserTrailProgressService.saveProgress() quando certified=true
 *  PERFECT_SCORE      → UserTrailProgressService.saveProgress() quando notaObtida>=100
 *  CARD_COMPLETED     → UserTrailProgressService.saveProgress() por novo item completado
 */
@Aspect
@Component
public class GamificationAspect {

    private static final Logger log = LoggerFactory.getLogger(GamificationAspect.class);

    private final XpService xpService;

    public GamificationAspect(XpService xpService) {
        this.xpService = xpService;
    }

    // ── Login diário ─────────────────────────────────────────────────────────

    @AfterReturning(
        pointcut  = "execution(* com.system.UDoc.service.AuthService.login(..))",
        returning = "result"
    )
    public void onLogin(Object result) {
        try {
            Long userId = extractId(result, "getId");
            if (userId == null) return;
            xpService.award(userId, EventType.DAILY_ACCESS, null);
        } catch (Exception e) {
            log.warn("GamificationAspect.onLogin: {}", e.getMessage());
        }
    }

    // ── Progresso de trilha ───────────────────────────────────────────────────

    @AfterReturning(
        pointcut  = "execution(* com.system.UDoc.service.UserTrailProgressService.saveProgress(..))",
        returning = "result"
    )
    public void onSaveProgress(JoinPoint jp, Object result) {
        try {
            Object[] args = jp.getArgs();
            Long userId  = firstLong(args, 0);
            Long trailId = firstLong(args, 1);
            if (userId == null || result == null) return;

            // Lê campos do DTO retornado via reflexão
            String  status       = (String)  invoke(result, "getStatus");
            Boolean certified    = (Boolean) invoke(result, "getCertified");
            Double  nota         = (Double)  invoke(result, "getNotaObtida");
            Object  completedRaw = invoke(result, "getCompletedItemsJson");

            // TRAIL_COMPLETED
            if ("completed".equals(status)) {
                xpService.award(userId, EventType.TRAIL_COMPLETED, trailId);
            }

            // CERTIFICATE_ISSUED
            if (Boolean.TRUE.equals(certified)) {
                xpService.award(userId, EventType.CERTIFICATE_ISSUED, trailId);
            }

            // PERFECT_SCORE (nota >= 100)
            if (nota != null && nota >= 100.0) {
                xpService.award(userId, EventType.PERFECT_SCORE, trailId);
            }

            // CARD_COMPLETED — conta itens completados no JSON e concede XP por cada um
            // (O AOP não sabe os itens anteriores, então concede por cada item no payload
            //  se ele passou a ter status completed agora — lida com idempotência pelo XpService
            //  não — abordagem: cada chamada com itemIndex concede 1 CARD XP se status=in_progress)
            // Simplificação: se há um `currentItemIndex` > 0 e status != completed,
            // concede XP pelo card completado (avançou pelo menos 1 item)
            Object idxRaw = invoke(result, "getCurrentItemIndex");
            if (idxRaw instanceof Number idx && idx.intValue() > 0 && !"completed".equals(status)) {
                xpService.award(userId, EventType.CARD_COMPLETED, trailId);
            }

        } catch (Exception e) {
            log.warn("GamificationAspect.onSaveProgress: {}", e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Long extractId(Object obj, String method) {
        if (obj == null) return null;
        try {
            Object val = obj.getClass().getMethod(method).invoke(obj);
            if (val instanceof Long l)    return l;
            if (val instanceof Integer i) return (long) i;
        } catch (Exception ignored) {}
        return null;
    }

    private Object invoke(Object obj, String method) {
        if (obj == null) return null;
        try { return obj.getClass().getMethod(method).invoke(obj); }
        catch (Exception e) { return null; }
    }

    private Long firstLong(Object[] args, int index) {
        if (args == null || args.length <= index) return null;
        Object a = args[index];
        if (a instanceof Long l)    return l;
        if (a instanceof Integer i) return (long) i;
        return null;
    }
}
