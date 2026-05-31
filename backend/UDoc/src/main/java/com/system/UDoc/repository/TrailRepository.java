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

    @Query("""
        SELECT t
        FROM Trail t
        WHERE

            (
                :search IS NULL
                OR TRIM(:search) = ''
                OR LOWER(t.name)
                    LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(t.description)
                    LIKE LOWER(CONCAT('%', :search, '%'))
            )

            AND

            (
                :active IS NULL
                OR t.active = :active
            )

        ORDER BY t.id DESC
    """)
    Page<Trail> searchTrails(

            @Param("search")
            String search,

            @Param("active")
            Boolean active,

            Pageable pageable
    );
}