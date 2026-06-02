package com.system.UDoc.dto;

import com.system.UDoc.entity.VideoRecording;
import java.time.LocalDateTime;

public class VideoRecordingDTO {
    private Long id;
    private Long trainingRoomId;
    private String filename;
    private Long fileSize;
    private Long durationSeconds;
    private LocalDateTime createdAt;

    public VideoRecordingDTO() {}
    public VideoRecordingDTO(VideoRecording r) {
        this.id = r.getId();
        this.trainingRoomId = r.getTrainingRoom() != null ? r.getTrainingRoom().getId() : null;
        this.filename = r.getFilename();
        this.fileSize = r.getFileSize();
        this.durationSeconds = r.getDurationSeconds();
        this.createdAt = r.getCreatedAt();
    }

    public Long getId() { return id; }
    public Long getTrainingRoomId() { return trainingRoomId; }
    public String getFilename() { return filename; }
    public Long getFileSize() { return fileSize; }
    public Long getDurationSeconds() { return durationSeconds; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
