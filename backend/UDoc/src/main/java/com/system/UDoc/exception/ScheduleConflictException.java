package com.system.UDoc.exception;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class ScheduleConflictException extends RuntimeException {

    private final List<ConflictDetail> conflicts;

    public ScheduleConflictException(List<ConflictDetail> conflicts) {
        super("Schedule conflict detected");
        this.conflicts = conflicts;
    }

    public List<ConflictDetail> getConflicts() {
        return conflicts;
    }

    public record ConflictDetail(
        String conflictType,   // ISM, COMPANY, EMPLOYEE
        String entityName,
        String trainingRoomTitle,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
    ) {}
}
