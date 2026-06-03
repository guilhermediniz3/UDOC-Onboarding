package com.system.UDoc.service;

import com.system.UDoc.entity.UserXpEvent;
import com.system.UDoc.entity.UserXpEvent.EventType;
import com.system.UDoc.repository.UserXpEventRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class XpService {

    // XP por tipo de evento
    public static final Map<EventType, Integer> XP_VALUES = Map.of(
        EventType.CARD_COMPLETED,     10,
        EventType.TRAIL_COMPLETED,    50,
        EventType.PERFECT_SCORE,      20,
        EventType.DAILY_ACCESS,        5,
        EventType.CERTIFICATE_ISSUED, 30
    );

    // Níveis: xp mínimo → nome + ícone + xp do próximo nível
    public record LevelInfo(int level, String name, String icon, int xpMin, int xpNext) {}

    private static final LevelInfo[] LEVELS = {
        new LevelInfo(1, "Iniciante",  "🌱",    0,    200),
        new LevelInfo(2, "Aprendiz",   "📚",  200,    500),
        new LevelInfo(3, "Praticante", "⚡",  500,   1000),
        new LevelInfo(4, "Avançado",   "🔥", 1000,   2000),
        new LevelInfo(5, "Expert",     "🏆", 2000, Integer.MAX_VALUE),
    };

    private final UserXpEventRepository xpEventRepository;

    public XpService(UserXpEventRepository xpEventRepository) {
        this.xpEventRepository = xpEventRepository;
    }

    // ── Registrar evento de XP ────────────────────────────────────────────────

    @Transactional
    public void award(Long userId, EventType eventType, Long referenceId) {
        // DAILY_ACCESS: apenas um por dia por usuário
        if (eventType == EventType.DAILY_ACCESS) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay   = startOfDay.plusDays(1);
            boolean alreadyToday = xpEventRepository.existsByUserIdAndEventTypeAndCreatedAtBetween(
                userId, EventType.DAILY_ACCESS, startOfDay, endOfDay);
            if (alreadyToday) return;
        }

        int xp = XP_VALUES.getOrDefault(eventType, 0);
        if (xp == 0) return;

        String by = resolveCurrentUser();
        xpEventRepository.save(new UserXpEvent(userId, eventType, xp, referenceId, by));
    }

    // ── XP total e nível ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public int getTotalXp(Long userId) {
        Integer total = xpEventRepository.sumXpByUser(userId);
        return total != null ? total : 0;
    }

    public LevelInfo getLevel(int totalXp) {
        LevelInfo current = LEVELS[0];
        for (LevelInfo l : LEVELS) {
            if (totalXp >= l.xpMin()) current = l;
        }
        return current;
    }

    /** DTO completo: XP total, nível, ícone, progresso para o próximo nível */
    @Transactional(readOnly = true)
    public XpSummary getSummary(Long userId) {
        int total = getTotalXp(userId);
        LevelInfo lvl = getLevel(total);

        int xpInLevel    = total - lvl.xpMin();
        int xpForNext    = lvl.xpNext() == Integer.MAX_VALUE ? 0 : lvl.xpNext() - lvl.xpMin();
        int progressPct  = xpForNext == 0 ? 100 : Math.min(100, (int) ((xpInLevel * 100.0) / xpForNext));

        return new XpSummary(total, lvl.level(), lvl.name(), lvl.icon(),
                             lvl.xpMin(), lvl.xpNext() == Integer.MAX_VALUE ? lvl.xpMin() : lvl.xpNext(),
                             progressPct);
    }

    // ── Ranking ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public java.util.List<java.util.Map<String, Object>> rankingInterno() {
        var rows = xpEventRepository.rankingInterno();
        return addLevelInfo(rows);
    }

    @Transactional(readOnly = true)
    public java.util.List<java.util.Map<String, Object>> rankingExterno(Long userId) {
        var rows = xpEventRepository.rankingExterno(userId);
        return addLevelInfo(rows);
    }

    private java.util.List<java.util.Map<String, Object>> addLevelInfo(
            java.util.List<java.util.Map<String, Object>> rows) {
        int position = 1;
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (java.util.Map<String, Object> row : rows) {
            java.util.Map<String, Object> enriched = new java.util.LinkedHashMap<>(row);
            int xp = toLong(row.get("totalxp")).intValue();
            LevelInfo lvl = getLevel(xp);
            enriched.put("position",  position++);
            enriched.put("levelNum",  lvl.level());
            enriched.put("levelName", lvl.name());
            enriched.put("levelIcon", lvl.icon());
            result.add(enriched);
        }
        return result;
    }

    private Long toLong(Object v) {
        if (v == null) return 0L;
        if (v instanceof Number n) return n.longValue();
        return Long.parseLong(v.toString());
    }

    private String resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "system";
    }

    // ── Record de resumo ─────────────────────────────────────────────────────

    public record XpSummary(
        int totalXp,
        int level,
        String levelName,
        String levelIcon,
        int xpCurrentLevel,
        int xpNextLevel,
        int progressPct
    ) {}
}
