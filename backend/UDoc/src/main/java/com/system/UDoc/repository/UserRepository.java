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

    java.util.List<User> findByRoleAndActiveTrue(com.system.UDoc.entity.Role role);

    @Query(
        value = """
            SELECT u.* FROM users u
            LEFT JOIN employee e ON e.user_id = u.id
            LEFT JOIN company  c ON c.id = e.company_id
            WHERE (:search  IS NULL OR u.name  ILIKE CONCAT('%', :search,  '%')
                                    OR u.email ILIKE CONCAT('%', :search,  '%'))
              AND (:active  IS NULL OR u.active  = :active)
              AND (:tipo    IS NULL OR e.tipo     = :tipo)
              AND (:company IS NULL OR c.name    ILIKE CONCAT('%', :company, '%'))
            ORDER BY u.name ASC
        """,
        countQuery = """
            SELECT COUNT(*) FROM users u
            LEFT JOIN employee e ON e.user_id = u.id
            LEFT JOIN company  c ON c.id = e.company_id
            WHERE (:search  IS NULL OR u.name  ILIKE CONCAT('%', :search,  '%')
                                    OR u.email ILIKE CONCAT('%', :search,  '%'))
              AND (:active  IS NULL OR u.active  = :active)
              AND (:tipo    IS NULL OR e.tipo     = :tipo)
              AND (:company IS NULL OR c.name    ILIKE CONCAT('%', :company, '%'))
        """,
        nativeQuery = true
    )
    Page<User> search(@Param("search")  String  search,
                      @Param("active")  Boolean active,
                      @Param("tipo")    String  tipo,
                      @Param("company") String  company,
                      Pageable pageable);
}
