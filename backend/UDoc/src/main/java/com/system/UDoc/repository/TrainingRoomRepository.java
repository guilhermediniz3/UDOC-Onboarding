package com.system.UDoc.repository;

import com.system.UDoc.entity.TrainingRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TrainingRoomRepository extends JpaRepository<TrainingRoom, Long> {

    /** Carrega sala com todas as relações necessárias para geração de RAT */
    @Query("""
        SELECT r FROM TrainingRoom r
        LEFT JOIN FETCH r.company
        LEFT JOIN FETCH r.ism
        LEFT JOIN FETCH r.trail
        LEFT JOIN FETCH r.invitedEmployees
        WHERE r.id = :id
    """)
    Optional<TrainingRoom> findByIdWithContext(@Param("id") Long id);

    @Query("SELECT COUNT(r) FROM TrainingRoom r WHERE r.trail.id = :trailId")
    long countByTrailId(@Param("trailId") Long trailId);

    /** Verifica se o funcionário já está matriculado em alguma sala desta trilha */
    @Query("SELECT COUNT(r) FROM TrainingRoom r JOIN r.invitedEmployees e WHERE r.trail.id = :trailId AND e.id = :employeeId")
    long countByTrailIdAndEmployee(@Param("trailId") Long trailId, @Param("employeeId") Long employeeId);

    /** Busca sala de auto-matrícula já existente para evitar duplicar */
    @Query("SELECT r FROM TrainingRoom r WHERE r.trail.id = :trailId AND r.company.id = :companyId AND r.ism.id = :ismId")
    java.util.Optional<com.system.UDoc.entity.TrainingRoom> findAutoEnrollRoom(
            @Param("trailId") Long trailId,
            @Param("companyId") Long companyId,
            @Param("ismId") Long ismId);

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

    /** Retorna salas vinculadas a uma trilha com empresa e ISM, excluindo canceladas */
    @Query("""
        SELECT r FROM TrainingRoom r
        JOIN FETCH r.company
        LEFT JOIN FETCH r.ism
        WHERE r.trail.id = :trailId
          AND r.company IS NOT NULL
          AND r.status <> com.system.UDoc.entity.TrainingRoomStatus.CANCELADA
        ORDER BY r.createdAt DESC
    """)
    List<TrainingRoom> findByTrailIdWithCompany(@Param("trailId") Long trailId);

    /** Maior sortOrder de salas de uma trilha — retorna -1 se não houver nenhuma */
    @Query("SELECT COALESCE(MAX(r.sortOrder), -1) FROM TrainingRoom r WHERE r.trail.id = :trailId")
    Integer findMaxSortOrderByTrailId(@Param("trailId") Long trailId);

    /** Salas da trilha com sortOrder >= targetOrder, excluindo a sala indicada (null = nenhuma exclusão) */
    @Query("""
        SELECT r FROM TrainingRoom r
        WHERE r.trail.id = :trailId
          AND r.sortOrder >= :sortOrder
          AND (:excludeId IS NULL OR r.id <> :excludeId)
        ORDER BY r.sortOrder ASC
    """)
    List<TrainingRoom> findByTrailIdAndSortOrderGte(
            @Param("trailId") Long trailId,
            @Param("sortOrder") int sortOrder,
            @Param("excludeId") Long excludeId
    );

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
