package com.system.UDoc.service;

import com.system.UDoc.dto.CalendarSessionDTO;
import com.system.UDoc.dto.TrainingSessionDTO;
import com.system.UDoc.dto.TrainingSessionRequestDTO;
import com.system.UDoc.entity.TrainingRoom;
import com.system.UDoc.entity.TrainingSession;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.exception.ScheduleConflictException;
import com.system.UDoc.exception.ScheduleConflictException.ConflictDetail;
import com.system.UDoc.repository.TrainingRoomRepository;
import com.system.UDoc.repository.TrainingSessionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class TrainingSessionService {

    private final TrainingSessionRepository sessionRepository;
    private final TrainingRoomRepository roomRepository;

    public TrainingSessionService(
            TrainingSessionRepository sessionRepository,
            TrainingRoomRepository roomRepository
    ) {
        this.sessionRepository = sessionRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<TrainingSessionDTO> getSessionsByRoom(Long roomId) {
        return sessionRepository
                .findByTrainingRoomIdOrderByDayNumberAsc(roomId)
                .stream().map(TrainingSessionDTO::new).toList();
    }

    /**
     * Replaces all sessions of a training room atomically.
     * Validates conflicts before saving.
     */
    @Transactional
    public List<TrainingSessionDTO> replaceRoomSessions(
            Long roomId,
            List<TrainingSessionRequestDTO> requests
    ) {
        TrainingRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Training room not found with id " + roomId));

        // Validate conflicts for all sessions before any save
        List<ConflictDetail> allConflicts = new ArrayList<>();
        for (TrainingSessionRequestDTO req : requests) {
            if (req.getDate() == null || req.getStartTime() == null || req.getEndTime() == null) continue;
            allConflicts.addAll(detectConflicts(room, req));
        }

        if (!allConflicts.isEmpty()) {
            throw new ScheduleConflictException(allConflicts);
        }

        // Delete existing and save new
        sessionRepository.deleteByTrainingRoomId(roomId);

        List<TrainingSession> saved = new ArrayList<>();
        for (TrainingSessionRequestDTO req : requests) {
            TrainingSession s = new TrainingSession();
            s.setTrainingRoom(room);
            s.setDayNumber(req.getDayNumber());
            s.setDate(req.getDate());
            s.setStartTime(req.getStartTime());
            s.setEndTime(req.getEndTime());
            saved.add(sessionRepository.save(s));
        }

        return saved.stream().map(TrainingSessionDTO::new).toList();
    }

    @Transactional
    public void deleteRoomSessions(Long roomId) {
        sessionRepository.deleteByTrainingRoomId(roomId);
    }

    @Transactional(readOnly = true)
    public List<CalendarSessionDTO> getCalendarSessions(
            int month, int year, Long ismId, Long companyId, Long employeeId
    ) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<TrainingSession> sessions = sessionRepository
                .findForCalendar(start, end, ismId, companyId);

        return sessions.stream()
                .filter(s -> {
                    // Filter by employee in Java since JPQL JOIN on collection is complex
                    if (employeeId == null) return true;
                    return s.getTrainingRoom().getInvitedEmployees()
                            .stream().anyMatch(e -> e.getId().equals(employeeId));
                })
                .map(CalendarSessionDTO::new)
                .toList();
    }

    /* ── Conflict detection ── */

    private List<ConflictDetail> detectConflicts(TrainingRoom room, TrainingSessionRequestDTO req) {
        List<ConflictDetail> conflicts = new ArrayList<>();

        Long roomId = room.getId() != null ? room.getId() : -1L;

        // ISM conflict
        if (room.getIsm() != null) {
            List<TrainingSession> ismConflicts = sessionRepository.findIsmConflicts(
                    room.getIsm().getId(), req.getDate(), req.getStartTime(), req.getEndTime(), roomId
            );
            for (TrainingSession c : ismConflicts) {
                conflicts.add(new ConflictDetail(
                        "ISM",
                        room.getIsm().getName(),
                        c.getTrainingRoom().getTitle(),
                        c.getDate(), c.getStartTime(), c.getEndTime()
                ));
            }
        }

        // Company conflict
        if (room.getCompany() != null) {
            List<TrainingSession> companyConflicts = sessionRepository.findCompanyConflicts(
                    room.getCompany().getId(), req.getDate(), req.getStartTime(), req.getEndTime(), roomId
            );
            for (TrainingSession c : companyConflicts) {
                conflicts.add(new ConflictDetail(
                        "COMPANY",
                        room.getCompany().getName(),
                        c.getTrainingRoom().getTitle(),
                        c.getDate(), c.getStartTime(), c.getEndTime()
                ));
            }
        }

        // Employee conflicts
        for (var employee : room.getInvitedEmployees()) {
            List<TrainingSession> empConflicts = sessionRepository.findEmployeeConflicts(
                    employee.getId(), req.getDate(), req.getStartTime(), req.getEndTime(), roomId
            );
            for (TrainingSession c : empConflicts) {
                conflicts.add(new ConflictDetail(
                        "EMPLOYEE",
                        employee.getName(),
                        c.getTrainingRoom().getTitle(),
                        c.getDate(), c.getStartTime(), c.getEndTime()
                ));
            }
        }

        return conflicts;
    }
}
