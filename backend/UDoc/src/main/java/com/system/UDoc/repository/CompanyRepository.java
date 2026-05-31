package com.system.UDoc.repository;

import com.system.UDoc.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    boolean existsByCnpj(String cnpj);
    boolean existsByCnpjAndIdNot(String cnpj, Long id);

    @Query(
        value = """
            SELECT * FROM company
            WHERE (:search IS NULL
                   OR name  ILIKE CONCAT('%', :search, '%')
                   OR cnpj  ILIKE CONCAT('%', :search, '%')
                   OR email ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR active = :active)
            ORDER BY name ASC
        """,
        countQuery = """
            SELECT COUNT(*) FROM company
            WHERE (:search IS NULL
                   OR name  ILIKE CONCAT('%', :search, '%')
                   OR cnpj  ILIKE CONCAT('%', :search, '%')
                   OR email ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR active = :active)
        """,
        nativeQuery = true
    )
    Page<Company> search(@Param("search") String search,
                         @Param("active") Boolean active,
                         Pageable pageable);
}
