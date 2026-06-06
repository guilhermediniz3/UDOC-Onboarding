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
     * JPQL com List<Enum> — sem native query para evitar problemas com array binding.
     */
    @org.springframework.data.jpa.repository.Query("""
        SELECT t FROM Trail t
        WHERE t.active = true
          AND (t.visibilidade IN :visibilidades OR t.visibilidade IS NULL)
          AND (:search IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY t.sortOrder ASC, t.id ASC
    """)
    java.util.List<Trail> findCatalog(
            @Param("visibilidades") java.util.List<Trail.Visibilidade> visibilidades,
            @Param("search") String search);
}
