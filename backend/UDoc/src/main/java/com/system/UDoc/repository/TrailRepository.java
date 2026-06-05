package com.system.UDoc.repository;

import com.system.UDoc.entity.Trail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrailRepository extends JpaRepository<Trail, Long> {

    boolean existsBySortOrder(Integer sortOrder);
    boolean existsBySortOrderAndIdNot(Integer sortOrder, Long id);

    @Query(
        value = """
            SELECT * FROM trail
            WHERE (:search IS NULL
                   OR name        ILIKE CONCAT('%', :search, '%')
                   OR description ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR active = :active)
            ORDER BY id DESC
        """,
        countQuery = """
            SELECT COUNT(*) FROM trail
            WHERE (:search IS NULL
                   OR name        ILIKE CONCAT('%', :search, '%')
                   OR description ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR active = :active)
        """,
        nativeQuery = true
    )
    Page<Trail> searchTrails(@Param("search") String search,
                             @Param("active") Boolean active,
                             Pageable pageable);

    /**
     * Catálogo: trilhas ativas, filtradas por visibilidade e nome.
     * visibilidades deve conter os valores de enum como strings (ex: ["AMBAS","INTERNA"]).
     */
    @Query(value = """
        SELECT * FROM trail
        WHERE active = true
          AND visibilidade = ANY(CAST(:visibilidades AS varchar[]))
          AND (:search IS NULL OR name ILIKE CONCAT('%', :search, '%'))
        ORDER BY sort_order ASC, id ASC
    """, nativeQuery = true)
    java.util.List<Trail> findCatalog(
            @Param("visibilidades") String[] visibilidades,
            @Param("search") String search);
}
