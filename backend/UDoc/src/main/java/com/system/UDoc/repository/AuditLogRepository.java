package com.system.UDoc.repository;

import com.system.UDoc.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findTop50ByOrderByTimestampDesc();

    @Query(value = """
        SELECT * FROM audit_log
        WHERE (:module      IS NULL OR LOWER(module)       LIKE LOWER(CONCAT('%',:module,'%')))
          AND (:action      IS NULL OR LOWER(action)       LIKE LOWER(CONCAT('%',:action,'%')))
          AND (:performedBy IS NULL OR LOWER(performed_by) LIKE LOWER(CONCAT('%',:performedBy,'%')))
          AND (:startDate   IS NULL OR CAST(timestamp AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate     IS NULL OR CAST(timestamp AS DATE) <= CAST(:endDate   AS DATE))
        ORDER BY timestamp DESC
    """,
    countQuery = """
        SELECT COUNT(*) FROM audit_log
        WHERE (:module      IS NULL OR LOWER(module)       LIKE LOWER(CONCAT('%',:module,'%')))
          AND (:action      IS NULL OR LOWER(action)       LIKE LOWER(CONCAT('%',:action,'%')))
          AND (:performedBy IS NULL OR LOWER(performed_by) LIKE LOWER(CONCAT('%',:performedBy,'%')))
          AND (:startDate   IS NULL OR CAST(timestamp AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate     IS NULL OR CAST(timestamp AS DATE) <= CAST(:endDate   AS DATE))
    """,
    nativeQuery = true)
    Page<AuditLog> searchAuditLogs(
            @Param("module")      String module,
            @Param("action")      String action,
            @Param("performedBy") String performedBy,
            @Param("startDate")   String startDate,
            @Param("endDate")     String endDate,
            Pageable pageable);
}
