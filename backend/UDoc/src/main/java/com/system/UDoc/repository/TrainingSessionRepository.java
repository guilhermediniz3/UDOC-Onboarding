package com.system.UDoc.repository;

import com.system.UDoc.entity.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {

    List<TrainingSession> findByTrainingRoomIdOrderByDayNumberAsc(Long trainingRoomId);

    @Modifying
    @Query("DELETE FROM TrainingSession s WHERE s.trainingRoom.id = :roomId")
    void deleteByTrainingRoomId(@Param("roomId") Long roomId);

    /* ── Conflict checks: overlapping interval = startTime < endTime2 AND endTime > startTime2 ── */

    @Query("""
        SELECT s FROM TrainingSession s
        JOIN s.trainingRoom r
        WHERE r.ism.id = :ismId
          AND r.id != :excludeRoomId
          AND s.date = :date
          AND s.startTime < :endTime
          AND s.endTime > :startTime
    """)
    List<TrainingSession> findIsmConflicts(
            @Param("ismId") Long ismId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeRoomId") Long excludeRoomId
    );

    @Query("""
        SELECT s FROM TrainingSession s
        JOIN s.trainingRoom r
        WHERE r.company.id = :companyId
          AND r.id != :excludeRoomId
          AND s.date = :date
          AND s.startTime < :endTime
          AND s.endTime > :startTime
    """)
    List<TrainingSession> findCompanyConflicts(
            @Param("companyId") Long companyId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeRoomId") Long excludeRoomId
    );

    @Query("""
        SELECT s FROM TrainingSession s
        JOIN s.trainingRoom r
        JOIN r.invitedEmployees e
        WHERE e.id = :employeeId
          AND r.id != :excludeRoomId
          AND s.date = :date
          AND s.startTime < :endTime
          AND s.endTime > :startTime
    """)
    List<TrainingSession> findEmployeeConflicts(
            @Param("employeeId") Long employeeId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeRoomId") Long excludeRoomId
    );

    /* ── Calendar query ── */

    @Query("""
        SELECT s FROM TrainingSession s
        JOIN FETCH s.trainingRoom r
        LEFT JOIN FETCH r.ism
        LEFT JOIN FETCH r.company
        WHERE s.date >= :startDate AND s.date <= :endDate
          AND (:ismId IS NULL OR r.ism.id = :ismId)
          AND (:companyId IS NULL OR r.company.id = :companyId)
    """)
    List<TrainingSession> findForCalendar(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("ismId") Long ismId,
            @Param("companyId") Long companyId
    );
}
