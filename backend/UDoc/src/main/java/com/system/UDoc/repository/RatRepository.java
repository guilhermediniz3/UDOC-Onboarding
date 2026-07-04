package com.system.UDoc.repository;

import com.system.UDoc.entity.Rat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RatRepository extends JpaRepository<Rat, Long> {

    @Query("""
        SELECT r FROM Rat r
        LEFT JOIN FETCH r.trainingRoom
        LEFT JOIN FETCH r.company
        LEFT JOIN FETCH r.ism
        LEFT JOIN FETCH r.autor
        WHERE r.id = :id
    """)
    Optional<Rat> findByIdWithRelations(@Param("id") Long id);

    @Query(
        value = """
            SELECT r FROM Rat r
            LEFT JOIN FETCH r.trainingRoom
            LEFT JOIN FETCH r.company
            LEFT JOIN FETCH r.ism
            LEFT JOIN FETCH r.autor
            WHERE (:ismId IS NULL OR r.ism.id = :ismId)
              AND (:companyId IS NULL OR r.company.id = :companyId)
              AND (:autorId IS NULL OR r.autor.id = :autorId)
              AND (:dataInicio IS NULL OR r.dataCriacao >= :dataInicio)
              AND (:dataFim IS NULL OR r.dataCriacao <= :dataFim)
            ORDER BY r.dataCriacao DESC
        """,
        countQuery = """
            SELECT COUNT(r) FROM Rat r
            WHERE (:ismId IS NULL OR r.ism.id = :ismId)
              AND (:companyId IS NULL OR r.company.id = :companyId)
              AND (:autorId IS NULL OR r.autor.id = :autorId)
              AND (:dataInicio IS NULL OR r.dataCriacao >= :dataInicio)
              AND (:dataFim IS NULL OR r.dataCriacao <= :dataFim)
        """
    )
    Page<Rat> findWithFilters(
        @Param("ismId") Long ismId,
        @Param("companyId") Long companyId,
        @Param("autorId") Long autorId,
        @Param("dataInicio") LocalDateTime dataInicio,
        @Param("dataFim") LocalDateTime dataFim,
        Pageable pageable
    );
}
