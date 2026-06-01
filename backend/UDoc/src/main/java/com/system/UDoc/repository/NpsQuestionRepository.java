package com.system.UDoc.repository;
import com.system.UDoc.entity.NpsQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface NpsQuestionRepository extends JpaRepository<NpsQuestion, Long> {
    List<NpsQuestion> findByReferenceTypeAndReferenceIdOrderByOrdemAsc(String type, Long id);
    @Modifying @Query("DELETE FROM NpsQuestion q WHERE q.referenceType = :type AND q.referenceId = :id")
    void deleteByReference(@Param("type") String type, @Param("id") Long id);
}
