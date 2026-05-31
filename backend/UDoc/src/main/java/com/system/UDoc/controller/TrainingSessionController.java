package com.system.UDoc.controller;

import com.system.UDoc.dto.CalendarSessionDTO;
import com.system.UDoc.dto.TrainingSessionDTO;
import com.system.UDoc.dto.TrainingSessionRequestDTO;
import com.system.UDoc.service.TrainingSessionService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class TrainingSessionController {

    private final TrainingSessionService trainingSessionService;

    public TrainingSessionController(TrainingSessionService trainingSessionService) {
        this.trainingSessionService = trainingSessionService;
    }

    /** Get all sessions for a training room */
    @GetMapping("/training-rooms/{id}/sessions")
    public ResponseEntity<List<TrainingSessionDTO>> getSessionsByRoom(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(trainingSessionService.getSessionsByRoom(id));
    }

    /** Replace all sessions for a training room (batch upsert) */
    @PutMapping("/training-rooms/{id}/sessions")
    public ResponseEntity<List<TrainingSessionDTO>> replaceRoomSessions(
            @PathVariable Long id,
            @Valid @RequestBody List<TrainingSessionRequestDTO> sessions
    ) {
        return ResponseEntity.ok(trainingSessionService.replaceRoomSessions(id, sessions));
    }

    /** Delete all sessions for a training room */
    @DeleteMapping("/training-rooms/{id}/sessions")
    public ResponseEntity<Void> deleteRoomSessions(@PathVariable Long id) {
        trainingSessionService.deleteRoomSessions(id);
        return ResponseEntity.noContent().build();
    }

    /** Calendar endpoint */
    @GetMapping("/training-sessions/calendar")
    public ResponseEntity<List<CalendarSessionDTO>> getCalendar(
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(required = false) Long ismId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long employeeId
    ) {
        return ResponseEntity.ok(
                trainingSessionService.getCalendarSessions(month, year, ismId, companyId, employeeId)
        );
    }
}
