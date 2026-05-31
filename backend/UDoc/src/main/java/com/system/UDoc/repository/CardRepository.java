package com.system.UDoc.repository;

import com.system.UDoc.dto.UserCardViewDTO;
import com.system.UDoc.entity.Card;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {


    @Query("""
    SELECT c
    FROM Card c
    WHERE

        (
            :search IS NULL
            OR TRIM(:search) = ''
            OR LOWER(c.title)
                LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.description)
                LIKE LOWER(CONCAT('%', :search, '%'))
        )

        AND

        (
            :active IS NULL
            OR c.active = :active
        )

    ORDER BY c.id DESC
""")

    Page<Card> searchAdminCards(

            @Param("search")
            String search,

            @Param("active")
            Boolean active,

            Pageable pageable
    );


    @Query("""
    SELECT new com.system.UDoc.dto.UserCardViewDTO(
        c.id,
        c.content
    )
    FROM Card c
    WHERE c.id = :id
""")
    Optional<UserCardViewDTO> findViewById(
            @Param("id")
            Long id
    );

    }



