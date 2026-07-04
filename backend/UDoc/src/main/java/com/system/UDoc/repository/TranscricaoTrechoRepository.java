package com.system.UDoc.repository;

import com.system.UDoc.entity.TranscricaoTrecho;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TranscricaoTrechoRepository extends JpaRepository<TranscricaoTrecho, Long> {
    List<TranscricaoTrecho> findByTrainingRoomIdOrderByTimestampAsc(Long trainingRoomId);
    long countByTrainingRoomId(Long trainingRoomId);
    List<TranscricaoTrecho> findBySessaoIdOrderByTimestampAsc(Long sessaoId);
    long countBySessaoId(Long sessaoId);
}
