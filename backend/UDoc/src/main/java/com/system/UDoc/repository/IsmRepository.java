package com.system.UDoc.repository;

import com.system.UDoc.entity.Ism;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface IsmRepository extends JpaRepository<Ism, Long> {

    @Query(
        value = """
            SELECT * FROM ism
            WHERE (:search IS NULL
                   OR name  ILIKE CONCAT('%', :search, '%')
                   OR email ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR active = :active)
              AND COALESCE(sistema_ism, false) = false
            ORDER BY name ASC
        """,
        countQuery = """
            SELECT COUNT(*) FROM ism
            WHERE (:search IS NULL
                   OR name  ILIKE CONCAT('%', :search, '%')
                   OR email ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR active = :active)
              AND COALESCE(sistema_ism, false) = false
        """,
        nativeQuery = true
    )
    Page<Ism> search(@Param("search") String search,
                     @Param("active") Boolean active,
                     Pageable pageable);

    java.util.Optional<Ism> findByUserId(Long userId);

    @Modifying @Transactional
    @Query("UPDATE Ism i SET i.user = null WHERE i.user.id = :userId")
    void clearUserById(@Param("userId") Long userId);

    @Query("SELECT i FROM Ism i WHERE LOWER(i.email) = LOWER(:email)")
    java.util.Optional<Ism> findByEmailIgnoreCase(@org.springframework.data.repository.query.Param("email") String email);

    java.util.Optional<Ism> findBySistemaIsmTrue();

    boolean existsBySistemaIsmTrue();
}
