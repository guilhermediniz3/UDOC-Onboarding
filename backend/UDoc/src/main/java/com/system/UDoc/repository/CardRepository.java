package com.system.UDoc.repository;

import com.system.UDoc.dto.UserCardViewDTO;
import com.system.UDoc.entity.Card;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {

    @Query(
        value = """
            SELECT * FROM card
            WHERE (:search IS NULL
                   OR title       ILIKE CONCAT('%', :search, '%')
                   OR description ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR active = :active)
            ORDER BY id DESC
        """,
        countQuery = """
            SELECT COUNT(*) FROM card
            WHERE (:search IS NULL
                   OR title       ILIKE CONCAT('%', :search, '%')
                   OR description ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR active = :active)
        """,
        nativeQuery = true
    )
    Page<Card> searchAdminCards(@Param("search") String search,
                                @Param("active") Boolean active,
                                Pageable pageable);

    /** Busca pública: quando hideInterno=true, exclui cards marcados como internos */
    @Query(
        value = """
            SELECT * FROM card
            WHERE (:search IS NULL
                   OR title       ILIKE CONCAT('%', :search, '%')
                   OR description ILIKE CONCAT('%', :search, '%'))
              AND active = true
              AND (:hideInterno = false OR interno = false)
            ORDER BY id DESC
        """,
        countQuery = """
            SELECT COUNT(*) FROM card
            WHERE (:search IS NULL
                   OR title       ILIKE CONCAT('%', :search, '%')
                   OR description ILIKE CONCAT('%', :search, '%'))
              AND active = true
              AND (:hideInterno = false OR interno = false)
        """,
        nativeQuery = true
    )
    Page<Card> searchPublicCards(@Param("search") String search,
                                 @Param("hideInterno") boolean hideInterno,
                                 Pageable pageable);

    @Query("""
        SELECT new com.system.UDoc.dto.UserCardViewDTO(c.id, c.content)
        FROM Card c WHERE c.id = :id
    """)
    Optional<UserCardViewDTO> findViewById(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Card c SET c.accessCount = c.accessCount + 1 WHERE c.id = :id")
    void incrementAccessCount(@Param("id") Long id);

    @Query(value = """
        SELECT
          c.id,
          c.title,
          COALESCE(c.access_count, 0) AS access_count,
          COUNT(CASE WHEN nr.score = 1 THEN 1 END) AS score1,
          COUNT(CASE WHEN nr.score = 2 THEN 1 END) AS score2,
          COUNT(CASE WHEN nr.score = 3 THEN 1 END) AS score3,
          COUNT(CASE WHEN nr.score = 4 THEN 1 END) AS score4
        FROM card c
        LEFT JOIN nps_question nq
          ON nq.reference_type = 'card'
         AND nq.reference_id = c.id
         AND nq.tipo = 'faces'
        LEFT JOIN nps_response nr
          ON nr.question_id = nq.id
         AND (:startDate IS NULL OR CAST(nr.created_at AS DATE) >= CAST(:startDate AS DATE))
         AND (:endDate   IS NULL OR CAST(nr.created_at AS DATE) <= CAST(:endDate   AS DATE))
        WHERE c.active = true
        GROUP BY c.id, c.title, c.access_count
        ORDER BY COALESCE(c.access_count, 0) DESC
        LIMIT :lim
    """, nativeQuery = true)
    List<Map<String, Object>> findTopAccessedCards(
            @Param("lim") int lim,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );
}
