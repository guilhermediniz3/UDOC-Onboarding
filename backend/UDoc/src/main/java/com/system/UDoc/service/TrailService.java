package com.system.UDoc.service;

import com.system.UDoc.dto.TrailDTO;
import com.system.UDoc.dto.TrailRequestDTO;
import com.system.UDoc.entity.Card;
import com.system.UDoc.entity.Trail;
import com.system.UDoc.exception.DuplicateSortOrderException;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.CardRepository;
import com.system.UDoc.repository.TrailRepository;
import com.system.UDoc.repository.UserTrailProgressRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TrailService {

    private final TrailRepository trailRepository;
    private final CardRepository cardRepository;
    private final UserTrailProgressRepository progressRepository;

    public TrailService(
            TrailRepository trailRepository,
            CardRepository cardRepository,
            UserTrailProgressRepository progressRepository
    ) {
        this.trailRepository = trailRepository;
        this.cardRepository = cardRepository;
        this.progressRepository = progressRepository;
    }

    @Transactional
    public TrailDTO createTrail(TrailRequestDTO request) {

        Integer sortOrder = request.getSortOrder() != null ? request.getSortOrder() : 0;

        if (trailRepository.existsBySortOrder(sortOrder)) {
            throw new DuplicateSortOrderException(
                    "Já existe uma trilha com a ordem " + sortOrder
            );
        }

        Trail trail = new Trail();

        trail.setName(request.getName());
        trail.setDescription(request.getDescription());
        trail.setActive(request.getActive() != null ? request.getActive() : true);
        trail.setSortOrder(sortOrder);
        trail.setCards(resolveCards(request.getCardIds()));

        return new TrailDTO(trailRepository.save(trail));
    }

    @Transactional(readOnly = true)
    public Page<TrailDTO> getAllTrails(
            String search,
            Boolean active,
            Pageable pageable
    ) {

        return trailRepository
                .searchTrails(normalize(search), active, pageable)
                .map(TrailDTO::new);
    }

    @Transactional(readOnly = true)
    public TrailDTO getTrailById(Long id) {

        Trail trail = findOrThrow(id);

        return new TrailDTO(trail);
    }

    @Transactional
    public TrailDTO updateTrail(Long id, TrailRequestDTO request) {

        Trail trail = findOrThrow(id);

        if (request.getSortOrder() != null) {
            boolean duplicated = trailRepository
                    .existsBySortOrderAndIdNot(request.getSortOrder(), id);

            if (duplicated) {
                throw new DuplicateSortOrderException(
                        "Já existe uma trilha com a ordem " + request.getSortOrder()
                );
            }
        }

        trail.setName(request.getName());
        trail.setDescription(request.getDescription());
        trail.setActive(request.getActive() != null ? request.getActive() : trail.getActive());
        trail.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : trail.getSortOrder());
        trail.setCards(resolveCards(request.getCardIds()));

        return new TrailDTO(trailRepository.save(trail));
    }

    @Transactional
    public void deleteTrail(Long id) {

        if (!trailRepository.existsById(id)) {
            throw new ResourceNotFoundException("Trail not found with id " + id);
        }

        if (progressRepository.existsByTrailIdAndCertifiedTrue(id)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.CONFLICT,
                "Esta trilha não pode ser excluída pois um ou mais funcionários já obtiveram certificação nela. " +
                "Para excluir, primeiro desative a trilha ou remova os registros de certificação."
            );
        }

        trailRepository.deleteById(id);
    }

    @Transactional
    public void swapSortOrder(Long id1, Long id2) {

        Trail trail1 = findOrThrow(id1);
        Trail trail2 = findOrThrow(id2);

        Integer order1 = trail1.getSortOrder();
        Integer order2 = trail2.getSortOrder();

        // Use a temporary value to avoid unique constraint violations during the swap
        trail1.setSortOrder(-1);
        trailRepository.save(trail1);

        trail2.setSortOrder(order1);
        trailRepository.save(trail2);

        trail1.setSortOrder(order2);
        trailRepository.save(trail1);
    }

    @Transactional
    public TrailDTO addCard(Long trailId, Long cardId) {

        Trail trail = findOrThrow(trailId);

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Card not found with id " + cardId)
                );

        if (!trail.getCards().contains(card)) {
            trail.getCards().add(card);
        }

        return new TrailDTO(trailRepository.save(trail));
    }

    @Transactional
    public TrailDTO removeCard(Long trailId, Long cardId) {

        Trail trail = findOrThrow(trailId);

        trail.getCards().removeIf(c -> c.getId().equals(cardId));

        return new TrailDTO(trailRepository.save(trail));
    }

    private String normalize(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private Trail findOrThrow(Long id) {
        return trailRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Trail not found with id " + id)
                );
    }

    private List<Card> resolveCards(List<Long> cardIds) {

        if (cardIds == null || cardIds.isEmpty()) {
            return new ArrayList<>();
        }

        return cardRepository.findAllById(cardIds);
    }
}
