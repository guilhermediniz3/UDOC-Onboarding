package com.system.UDoc.repository;

import com.system.UDoc.entity.TrainingRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrainingRoomRepository extends JpaRepository<TrainingRoom, Long> {
    @Query("SELECT r FROM TrainingRoom r LEFT JOIN r.ism i WHERE (:search IS NULL OR TRIM(:search) = '' OR LOWER(r.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND (:active IS NULL OR r.active = :active) ORDER BY r.createdAt DESC")
    Page<TrainingRoom> search(@Param("search") String search, @Param("active") Boolean active, Pageable pageable);
}
