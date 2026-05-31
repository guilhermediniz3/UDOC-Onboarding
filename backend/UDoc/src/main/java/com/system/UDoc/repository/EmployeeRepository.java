package com.system.UDoc.repository;

import com.system.UDoc.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    @Query("SELECT e FROM Employee e JOIN FETCH e.company c WHERE (:search IS NULL OR TRIM(:search) = '' OR LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND (:active IS NULL OR e.active = :active) ORDER BY e.name ASC")
    Page<Employee> search(@Param("search") String search, @Param("active") Boolean active, Pageable pageable);
}
