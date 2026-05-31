package com.system.UDoc.controller;

import com.system.UDoc.dto.TrainingRoomDTO;
import com.system.UDoc.dto.TrainingRoomRequestDTO;
import com.system.UDoc.service.TrainingRoomService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/training-rooms")
public class TrainingRoomController {

    private final TrainingRoomService trainingRoomService;

    public TrainingRoomController(TrainingRoomService trainingRoomService) {
        this.trainingRoomService = trainingRoomService;
    }

    @PostMapping
    public ResponseEntity<TrainingRoomDTO> createTrainingRoom(
            @Valid @RequestBody TrainingRoomRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(trainingRoomService.createTrainingRoom(request));
    }

    @GetMapping
    public ResponseEntity<Page<TrainingRoomDTO>> getAllTrainingRooms(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            Pageable pageable
    ) {
        return ResponseEntity.ok(trainingRoomService.getAllTrainingRooms(search, active, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingRoomDTO> getTrainingRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(trainingRoomService.getTrainingRoomById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingRoomDTO> updateTrainingRoom(
            @PathVariable Long id,
            @Valid @RequestBody TrainingRoomRequestDTO request
    ) {
        return ResponseEntity.ok(trainingRoomService.updateTrainingRoom(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrainingRoom(@PathVariable Long id) {
        trainingRoomService.deleteTrainingRoom(id);
        return ResponseEntity.noContent().build();
    }
}
