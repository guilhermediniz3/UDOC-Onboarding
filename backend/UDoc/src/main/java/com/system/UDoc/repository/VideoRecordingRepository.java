package com.system.UDoc.repository;

import com.system.UDoc.entity.VideoRecording;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface VideoRecordingRepository extends JpaRepository<VideoRecording, Long> {
    List<VideoRecording> findByTrainingRoomIdOrderByCreatedAtDesc(Long trainingRoomId);

    List<VideoRecording> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(r.fileSize), 0) FROM VideoRecording r WHERE r.fileSize IS NOT NULL")
    Long sumFileSizes();
}
