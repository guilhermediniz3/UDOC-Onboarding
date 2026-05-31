package com.system.UDoc.dto;

import com.system.UDoc.entity.TrainingSession;

import java.time.LocalDate;
import java.time.LocalTime;

public class TrainingSessionDTO {

    private Long id;
    private Long trainingRoomId;
    private Integer dayNumber;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;

    public TrainingSessionDTO() {}

    public TrainingSessionDTO(TrainingSession s) {
        this.id = s.getId();
        this.trainingRoomId = s.getTrainingRoom().getId();
        this.dayNumber = s.getDayNumber();
        this.date = s.getDate();
        this.startTime = s.getStartTime();
        this.endTime = s.getEndTime();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTrainingRoomId() { return trainingRoomId; }
    public void setTrainingRoomId(Long trainingRoomId) { this.trainingRoomId = trainingRoomId; }
    public Integer getDayNumber() { return dayNumber; }
    public void setDayNumber(Integer dayNumber) { this.dayNumber = dayNumber; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}
