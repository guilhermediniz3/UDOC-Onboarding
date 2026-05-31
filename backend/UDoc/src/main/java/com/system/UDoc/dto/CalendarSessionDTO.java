package com.system.UDoc.dto;

import com.system.UDoc.entity.Employee;
import com.system.UDoc.entity.TrainingSession;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class CalendarSessionDTO {

    private Long sessionId;
    private Long trainingRoomId;
    private String trainingRoomTitle;
    private String trainingRoomStatus;
    private Integer dayNumber;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long ismId;
    private String ismName;
    private Long companyId;
    private String companyName;
    private List<Long> invitedEmployeeIds;
    private List<String> invitedEmployeeNames;

    public CalendarSessionDTO() {}

    public CalendarSessionDTO(TrainingSession s) {
        this.sessionId = s.getId();
        this.dayNumber = s.getDayNumber();
        this.date = s.getDate();
        this.startTime = s.getStartTime();
        this.endTime = s.getEndTime();

        var room = s.getTrainingRoom();
        this.trainingRoomId = room.getId();
        this.trainingRoomTitle = room.getTitle();
        this.trainingRoomStatus = room.getStatus().name();

        if (room.getIsm() != null) {
            this.ismId = room.getIsm().getId();
            this.ismName = room.getIsm().getName();
        }
        if (room.getCompany() != null) {
            this.companyId = room.getCompany().getId();
            this.companyName = room.getCompany().getName();
        }
        if (room.getInvitedEmployees() != null) {
            this.invitedEmployeeIds = room.getInvitedEmployees().stream().map(Employee::getId).toList();
            this.invitedEmployeeNames = room.getInvitedEmployees().stream().map(Employee::getName).toList();
        }
    }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public Long getTrainingRoomId() { return trainingRoomId; }
    public void setTrainingRoomId(Long trainingRoomId) { this.trainingRoomId = trainingRoomId; }
    public String getTrainingRoomTitle() { return trainingRoomTitle; }
    public void setTrainingRoomTitle(String trainingRoomTitle) { this.trainingRoomTitle = trainingRoomTitle; }
    public String getTrainingRoomStatus() { return trainingRoomStatus; }
    public void setTrainingRoomStatus(String trainingRoomStatus) { this.trainingRoomStatus = trainingRoomStatus; }
    public Integer getDayNumber() { return dayNumber; }
    public void setDayNumber(Integer dayNumber) { this.dayNumber = dayNumber; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public Long getIsmId() { return ismId; }
    public void setIsmId(Long ismId) { this.ismId = ismId; }
    public String getIsmName() { return ismName; }
    public void setIsmName(String ismName) { this.ismName = ismName; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public List<Long> getInvitedEmployeeIds() { return invitedEmployeeIds; }
    public void setInvitedEmployeeIds(List<Long> ids) { this.invitedEmployeeIds = ids; }
    public List<String> getInvitedEmployeeNames() { return invitedEmployeeNames; }
    public void setInvitedEmployeeNames(List<String> names) { this.invitedEmployeeNames = names; }
}
