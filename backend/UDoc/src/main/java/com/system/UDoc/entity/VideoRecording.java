package com.system.UDoc.entity;

import jakarta.persistence.*;
import com.system.UDoc.entity.AuditableEntity;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_recording")
public class VideoRecording extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "training_room_id")
    private TrainingRoom trainingRoom;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String filePath;

    @Column
    private Long fileSize; // bytes

    @Column
    private Long durationSeconds;

    @Column(nullable = false, updatable = false)

    public VideoRecording() {}

    public Long getId() { return id; }
    public TrainingRoom getTrainingRoom() { return trainingRoom; } public void setTrainingRoom(TrainingRoom v) { this.trainingRoom = v; }
    public String getFilename() { return filename; } public void setFilename(String v) { this.filename = v; }
    public String getFilePath() { return filePath; } public void setFilePath(String v) { this.filePath = v; }
    public Long getFileSize() { return fileSize; } public void setFileSize(Long v) { this.fileSize = v; }
    public Long getDurationSeconds() { return durationSeconds; } public void setDurationSeconds(Long v) { this.durationSeconds = v; }
}
