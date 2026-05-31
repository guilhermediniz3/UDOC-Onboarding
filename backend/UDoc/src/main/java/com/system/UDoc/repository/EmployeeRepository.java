package com.system.UDoc.repository;

import com.system.UDoc.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    @Query(
        value = """
            SELECT e.* FROM employee e
            JOIN company c ON c.id = e.company_id
            WHERE (:search IS NULL
                   OR e.name  ILIKE CONCAT('%', :search, '%')
                   OR e.email ILIKE CONCAT('%', :search, '%')
                   OR c.name  ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR e.active = :active)
            ORDER BY e.name ASC
        """,
        countQuery = """
            SELECT COUNT(*) FROM employee e
            JOIN company c ON c.id = e.company_id
            WHERE (:search IS NULL
                   OR e.name  ILIKE CONCAT('%', :search, '%')
                   OR e.email ILIKE CONCAT('%', :search, '%')
                   OR c.name  ILIKE CONCAT('%', :search, '%'))
              AND (:active IS NULL OR e.active = :active)
        """,
        nativeQuery = true
    )
    Page<Employee> search(@Param("search") String search,
                          @Param("active") Boolean active,
                          Pageable pageable);
}
