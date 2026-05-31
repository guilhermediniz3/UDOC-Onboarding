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

    @Query("SELECT c FROM Company c WHERE (:search IS NULL OR TRIM(:search) = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.cnpj) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND (:active IS NULL OR c.active = :active) ORDER BY c.name ASC")
    Page<Company> search(@Param("search") String search, @Param("active") Boolean active, Pageable pageable);
}
