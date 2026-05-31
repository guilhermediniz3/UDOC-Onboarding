package com.system.UDoc.repository;
import com.system.UDoc.entity.Training;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface TrainingRepository extends JpaRepository<Training, Long> {
    List<Training> findByTrailIdOrderByDataInicioDesc(Long trailId);
    @Query("SELECT t FROM Training t JOIN FETCH t.company WHERE t.trail.id = :trailId ORDER BY t.dataInicio DESC")
    List<Training> findByTrailIdWithCompany(@Param("trailId") Long trailId);
}
