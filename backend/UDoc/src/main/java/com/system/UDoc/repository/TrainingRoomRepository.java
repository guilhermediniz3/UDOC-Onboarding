package com.system.UDoc.repository;

import com.system.UDoc.entity.TrainingRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TrainingRoomRepository extends JpaRepository<TrainingRoom, Long> {

    @Query(
        value = """
            SELECT r.* FROM training_room r
            LEFT JOIN ism i ON i.id = r.ism_id
            WHERE (:search IS NULL
                   OR r.title ILIKE CONCAT('%', :search, '%')
                   OR i.name  ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR r.active = :active)
            ORDER BY r.created_at DESC
        """,
        countQuery = """
            SELECT COUNT(*) FROM training_room r
            LEFT JOIN ism i ON i.id = r.ism_id
            WHERE (:search IS NULL
                   OR r.title ILIKE CONCAT('%', :search, '%')
                   OR i.name  ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR r.active = :active)
        """,
        nativeQuery = true
    )
    Page<TrainingRoom> search(@Param("search") String search,
                              @Param("active") Boolean active,
                              Pageable pageable);

    /** Retorna salas vinculadas a uma trilha com empresa, excluindo canceladas */
    @Query("""
        SELECT r FROM TrainingRoom r
        JOIN FETCH r.company
        WHERE r.trail.id = :trailId
          AND r.company IS NOT NULL
          AND r.status <> com.system.UDoc.entity.TrainingRoomStatus.CANCELADA
        ORDER BY r.createdAt DESC
    """)
    List<TrainingRoom> findByTrailIdWithCompany(@Param("trailId") Long trailId);

    /** Salas em que o funcionário é convidado e que têm trilha definida */
    @Query("""
        SELECT r FROM TrainingRoom r
        JOIN r.invitedEmployees e
        WHERE e.id = :employeeId
          AND r.trail IS NOT NULL
          AND r.status <> com.system.UDoc.entity.TrainingRoomStatus.CANCELADA
    """)
    List<TrainingRoom> findByInvitedEmployeeId(@Param("employeeId") Long employeeId);
}
