package com.system.UDoc.repository;
import com.system.UDoc.entity.TrailContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface TrailContentRepository extends JpaRepository<TrailContent, Long> {
    List<TrailContent> findByTrailIdOrderByOrdemAsc(Long trailId);
    @Modifying
    @Query("DELETE FROM TrailContent c WHERE c.trail.id = :trailId")
    void deleteByTrailId(@Param("trailId") Long trailId);
}
