package com.system.UDoc.repository;

import com.system.UDoc.dto.UserCardViewDTO;
import com.system.UDoc.entity.Card;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("""
        SELECT new com.system.UDoc.dto.UserCardViewDTO(c.id, c.content)
        FROM Card c WHERE c.id = :id
    """)
    Optional<UserCardViewDTO> findViewById(@Param("id") Long id);
}
