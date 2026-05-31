package com.system.UDoc.repository;

import com.system.UDoc.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);

    Optional<User> findByResetToken(String resetToken);

    @Query("SELECT u FROM User u WHERE (:search IS NULL OR TRIM(:search) = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND (:active IS NULL OR u.active = :active) ORDER BY u.name ASC")
    Page<User> search(@Param("search") String search, @Param("active") Boolean active, Pageable pageable);
}
