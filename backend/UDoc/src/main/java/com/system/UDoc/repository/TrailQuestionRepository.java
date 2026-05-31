package com.system.UDoc.repository;
import com.system.UDoc.entity.TrailQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface TrailQuestionRepository extends JpaRepository<TrailQuestion, Long> {
    List<TrailQuestion> findByTrailIdOrderByOrdemAsc(Long trailId);
    @Modifying
    @Query("DELETE FROM TrailQuestion q WHERE q.trail.id = :trailId")
    void deleteByTrailId(@Param("trailId") Long trailId);
    @Query("SELECT COALESCE(SUM(q.pontos), 0.0) FROM TrailQuestion q WHERE q.trail.id = :trailId")
    Double sumPontosByTrailId(@Param("trailId") Long trailId);
    @Query("SELECT COUNT(q) FROM TrailQuestion q WHERE q.trail.id = :trailId")
    int countByTrailId(@Param("trailId") Long trailId);
}
