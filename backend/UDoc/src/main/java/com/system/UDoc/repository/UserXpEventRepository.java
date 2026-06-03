package com.system.UDoc.repository;

import com.system.UDoc.entity.UserXpEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface UserXpEventRepository extends JpaRepository<UserXpEvent, Long> {

    @Query("SELECT COALESCE(SUM(e.xp), 0) FROM UserXpEvent e WHERE e.userId = :userId")
    Integer sumXpByUser(@Param("userId") Long userId);

    boolean existsByUserIdAndEventTypeAndCreatedAtBetween(
            Long userId,
            UserXpEvent.EventType eventType,
            java.time.LocalDateTime start,
            java.time.LocalDateTime end);

    List<UserXpEvent> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Ranking de funcionários internos: soma XP e conta trilhas concluídas */
    @Query(value = """
        SELECT
          e.id             AS employeeId,
          e.name           AS employeeName,
          e.photo          AS employeePhoto,
          COALESCE(SUM(x.xp), 0) AS totalXp,
          COUNT(DISTINCT CASE WHEN x.event_type = 'TRAIL_COMPLETED' THEN x.reference_id END) AS trailsCompleted
        FROM employee e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN user_xp_events x ON x.user_id = u.id
        WHERE e.tipo = 'INTERNO'
          AND e.active = true
          AND u.active = true
        GROUP BY e.id, e.name, e.photo
        ORDER BY totalXp DESC
    """, nativeQuery = true)
    List<java.util.Map<String, Object>> rankingInterno();

    /** Ranking de funcionários externos da mesma empresa */
    @Query(value = """
        SELECT
          e.id             AS employeeId,
          e.name           AS employeeName,
          e.photo          AS employeePhoto,
          COALESCE(SUM(x.xp), 0) AS totalXp,
          COUNT(DISTINCT CASE WHEN x.event_type = 'TRAIL_COMPLETED' THEN x.reference_id END) AS trailsCompleted
        FROM employee e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN user_xp_events x ON x.user_id = u.id
        WHERE e.tipo = 'EXTERNO'
          AND e.active = true
          AND u.active = true
          AND e.company_id = (SELECT company_id FROM employee WHERE user_id = :userId AND active = true LIMIT 1)
        GROUP BY e.id, e.name, e.photo
        ORDER BY totalXp DESC
    """, nativeQuery = true)
    List<java.util.Map<String, Object>> rankingExterno(@Param("userId") Long userId);
}
