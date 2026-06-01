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

    @Query(value = """
        SELECT score, COUNT(*) AS total
        FROM nps_response
        WHERE score IS NOT NULL
          AND (:startDate IS NULL OR CAST(created_at AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate   IS NULL OR CAST(created_at AS DATE) <= CAST(:endDate   AS DATE))
        GROUP BY score
        ORDER BY score
    """, nativeQuery = true)
    List<Map<String, Object>> satisfactionDistribution(
            @Param("startDate") String startDate,
            @Param("endDate")   String endDate
    );

    @Query(value = """
        SELECT CAST(created_at AS DATE) AS dia,
               ROUND(AVG(score)::numeric, 2) AS media
        FROM nps_response
        WHERE score IS NOT NULL
          AND (:startDate IS NULL OR CAST(created_at AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate   IS NULL OR CAST(created_at AS DATE) <= CAST(:endDate   AS DATE))
        GROUP BY CAST(created_at AS DATE)
        ORDER BY dia DESC
        LIMIT 30
    """, nativeQuery = true)
    List<Map<String, Object>> npsTimeline(
            @Param("startDate") String startDate,
            @Param("endDate")   String endDate
    );

    @Query(value = """
        SELECT COUNT(*) FROM nps_response
        WHERE score IS NOT NULL
          AND (:startDate IS NULL OR CAST(created_at AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate   IS NULL OR CAST(created_at AS DATE) <= CAST(:endDate   AS DATE))
    """, nativeQuery = true)
    Long countResponses(
            @Param("startDate") String startDate,
            @Param("endDate")   String endDate
    );
}
