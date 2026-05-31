package com.system.UDoc.repository;

import com.system.UDoc.entity.Ism;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IsmRepository extends JpaRepository<Ism, Long> {
    @Query("SELECT i FROM Ism i WHERE (:search IS NULL OR TRIM(:search) = '' OR LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND (:active IS NULL OR i.active = :active) ORDER BY i.name ASC")
    Page<Ism> search(@Param("search") String search, @Param("active") Boolean active, Pageable pageable);
}
