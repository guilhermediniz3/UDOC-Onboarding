package com.system.UDoc.controller;

import com.system.UDoc.dto.TrailDTO;
import com.system.UDoc.dto.TrailRequestDTO;
import com.system.UDoc.service.TrailService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/trails")
public class TrailController {

    private final TrailService trailService;

    public TrailController(TrailService trailService) {
        this.trailService = trailService;
    }

    @PostMapping
    public ResponseEntity<TrailDTO> createTrail(
            @Valid @RequestBody TrailRequestDTO request
    ) {

        TrailDTO created = trailService.createTrail(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }

    @GetMapping
    public ResponseEntity<Page<TrailDTO>> getAllTrails(

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            Boolean active,

            Pageable pageable
    ) {

        return ResponseEntity.ok(
                trailService.getAllTrails(search, active, pageable)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrailDTO> getTrailById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                trailService.getTrailById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrailDTO> updateTrail(

            @PathVariable Long id,

            @Valid @RequestBody TrailRequestDTO request
    ) {

        return ResponseEntity.ok(
                trailService.updateTrail(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrail(
            @PathVariable Long id
    ) {

        trailService.deleteTrail(id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{trailId}/cards/{cardId}")
    public ResponseEntity<TrailDTO> addCard(

            @PathVariable Long trailId,

            @PathVariable Long cardId
    ) {

        return ResponseEntity.ok(
                trailService.addCard(trailId, cardId)
        );
    }

    @DeleteMapping("/{trailId}/cards/{cardId}")
    public ResponseEntity<TrailDTO> removeCard(

            @PathVariable Long trailId,

            @PathVariable Long cardId
    ) {

        return ResponseEntity.ok(
                trailService.removeCard(trailId, cardId)
        );
    }

    @PutMapping("/{id1}/swap/{id2}")
    public ResponseEntity<Void> swapSortOrder(

            @PathVariable Long id1,

            @PathVariable Long id2
    ) {

        trailService.swapSortOrder(id1, id2);

        return ResponseEntity.noContent().build();
    }
}