package com.system.UDoc.controller;

import com.system.UDoc.dto.CardDTO;
import com.system.UDoc.dto.UserCardViewDTO;
import com.system.UDoc.service.CardService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cards")

public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @PostMapping
    public ResponseEntity<CardDTO> createCard(
            @Valid @RequestBody CardDTO cardDTO
    ) {

        CardDTO createdCard =
                cardService.createCard(cardDTO);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdCard);
    }

    @GetMapping
    public ResponseEntity<Page<CardDTO>> getAllCards(

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            Boolean active,

            Pageable pageable
    ) {

        Page<CardDTO> cards =
                cardService.getAllCards(
                        search,
                        active,
                        pageable
                );

        return ResponseEntity.ok(cards);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CardDTO> getCardById(
            @PathVariable Long id
    ) {

        CardDTO card =
                cardService.getCardById(id);

        return ResponseEntity.ok(card);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CardDTO> updateCard(

            @PathVariable Long id,

            @Valid @RequestBody CardDTO cardDTO
    ) {

        CardDTO updatedCard =
                cardService.updateCard(
                        id,
                        cardDTO
                );

        return ResponseEntity.ok(updatedCard);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCard(
            @PathVariable Long id
    ) {

        cardService.deleteCard(id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<CardDTO> cloneCard(
            @PathVariable Long id
    ) {

        CardDTO clonedCard =
                cardService.cloneCard(id);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(clonedCard);
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<UserCardViewDTO> view(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                cardService.findViewById(id)
        );
    }
}