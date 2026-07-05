package com.system.UDoc.repository;

import com.system.UDoc.entity.Rat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RatRepository extends JpaRepository<Rat, Long>, JpaSpecificationExecutor<Rat> {

    @Query("""
        SELECT r FROM Rat r
        LEFT JOIN FETCH r.trainingRoom
        LEFT JOIN FETCH r.company
        LEFT JOIN FETCH r.ism
        LEFT JOIN FETCH r.autor
        WHERE r.id = :id
    """)
    Optional<Rat> findByIdWithRelations(@Param("id") Long id);

    Optional<Rat> findBySessaoId(@Param("sessaoId") Long sessaoId);
}
