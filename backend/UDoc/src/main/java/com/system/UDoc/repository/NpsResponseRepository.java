package com.system.UDoc.repository;

import com.system.UDoc.entity.NpsResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface NpsResponseRepository extends JpaRepository<NpsResponse, Long> {

    List<NpsResponse> findByQuestionId(Long questionId);

    @Query("""
        SELECT AVG(r.score) FROM NpsResponse r
        WHERE r.question.referenceType = :type
          AND r.question.referenceId = :id
          AND r.score IS NOT NULL
    """)
    Double avgScoreByReference(@Param("type") String type, @Param("id") Long id);

    /** Distribuição de satisfação — apenas respostas de TRILHAS */
    @Query(value = """
        SELECT nr.score, COUNT(*) AS total
        FROM nps_response nr
        JOIN nps_question nq ON nq.id = nr.question_id
        WHERE nr.score IS NOT NULL
          AND nq.reference_type = 'trail'
          AND (:startDate IS NULL OR CAST(nr.created_at AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate   IS NULL OR CAST(nr.created_at AS DATE) <= CAST(:endDate   AS DATE))
        GROUP BY nr.score
        ORDER BY nr.score
    """, nativeQuery = true)
    List<Map<String, Object>> satisfactionDistribution(
            @Param("startDate") String startDate,
            @Param("endDate")   String endDate
    );

    /** Tendência de satisfação — apenas respostas de TRILHAS */
    @Query(value = """
        SELECT CAST(nr.created_at AS DATE) AS dia,
               ROUND(AVG(nr.score)::numeric, 2) AS media
        FROM nps_response nr
        JOIN nps_question nq ON nq.id = nr.question_id
        WHERE nr.score IS NOT NULL
          AND nq.reference_type = 'trail'
          AND (:startDate IS NULL OR CAST(nr.created_at AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate   IS NULL OR CAST(nr.created_at AS DATE) <= CAST(:endDate   AS DATE))
        GROUP BY CAST(nr.created_at AS DATE)
        ORDER BY dia DESC
        LIMIT 30
    """, nativeQuery = true)
    List<Map<String, Object>> npsTimeline(
            @Param("startDate") String startDate,
            @Param("endDate")   String endDate
    );

    /** Contagem de respostas — apenas respostas de TRILHAS */
    @Query(value = """
        SELECT COUNT(*) FROM nps_response nr
        JOIN nps_question nq ON nq.id = nr.question_id
        WHERE nr.score IS NOT NULL
          AND nq.reference_type = 'trail'
          AND (:startDate IS NULL OR CAST(nr.created_at AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate   IS NULL OR CAST(nr.created_at AS DATE) <= CAST(:endDate   AS DATE))
    """, nativeQuery = true)
    Long countResponses(
            @Param("startDate") String startDate,
            @Param("endDate")   String endDate
    );
}
