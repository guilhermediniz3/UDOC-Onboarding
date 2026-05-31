package com.system.UDoc.repository;
import com.system.UDoc.entity.TrainingEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface TrainingEmployeeRepository extends JpaRepository<TrainingEmployee, Long> {
    List<TrainingEmployee> findByTrainingId(Long trainingId);
    @Query("SELECT te FROM TrainingEmployee te JOIN FETCH te.employee WHERE te.training.id = :trainingId")
    List<TrainingEmployee> findByTrainingIdWithEmployee(@Param("trainingId") Long trainingId);
}
