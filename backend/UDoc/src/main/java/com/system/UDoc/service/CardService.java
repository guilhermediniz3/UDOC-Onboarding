package com.system.UDoc.service;

import com.system.UDoc.dto.CardDTO;
import com.system.UDoc.dto.UserCardViewDTO;
import com.system.UDoc.entity.Card;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.CardRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CardService {

    private final CardRepository cardRepository;

    public CardService(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    @Transactional
    public CardDTO createCard(CardDTO cardDTO) {

        Card card = new Card();

        card.setTitle(cardDTO.getTitle());
        card.setDescription(cardDTO.getDescription());
        card.setIcon(cardDTO.getIcon());
        card.setActive(cardDTO.getActive());
        card.setContent(cardDTO.getContent());
        card.setTrail(cardDTO.getTrail() != null ? cardDTO.getTrail() : false);
        card.setSortOrder(cardDTO.getSortOrder() != null ? cardDTO.getSortOrder() : 0);
        card.setInterno(cardDTO.getInterno() != null ? cardDTO.getInterno() : false);

        Card savedCard = cardRepository.save(card);

        return new CardDTO(savedCard);
    }

    @Transactional(readOnly = true)
    public Page<CardDTO> getAllCards(
            String search,
            Boolean active,
            Pageable pageable
    ) {
        String s = (search == null || search.isBlank()) ? null : search;
        return cardRepository.searchAdminCards(s, active, pageable).map(CardDTO::new);
    }

    /** Busca pública — hideInterno=true exclui cards internos (para usuários externos) */
    @Transactional(readOnly = true)
    public Page<CardDTO> getPublicCards(String search, boolean hideInterno, Pageable pageable) {
        String s = (search == null || search.isBlank()) ? null : search;
        return cardRepository.searchPublicCards(s, hideInterno, pageable).map(CardDTO::new);
    }
    @Transactional(readOnly = true)
    public CardDTO getCardById(Long id) {

        Card card = cardRepository.findById(id)

                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Card not found with id " + id
                        )
                );

        return new CardDTO(card);
    }

    @Transactional
    public CardDTO updateCard(
            Long id,
            CardDTO cardDTO
    ) {

        Card card = cardRepository.findById(id)

                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Card not found with id " + id
                        )
                );

        card.setTitle(cardDTO.getTitle());
        card.setDescription(cardDTO.getDescription());
        card.setIcon(cardDTO.getIcon());
        card.setActive(cardDTO.getActive());
        card.setContent(cardDTO.getContent());
        card.setTrail(cardDTO.getTrail() != null ? cardDTO.getTrail() : false);
        card.setSortOrder(cardDTO.getSortOrder() != null ? cardDTO.getSortOrder() : 0);
        card.setInterno(cardDTO.getInterno() != null ? cardDTO.getInterno() : false);

        Card savedCard = cardRepository.save(card);

        return new CardDTO(savedCard);
    }

    @Transactional
    public void deleteCard(Long id) {

        if (!cardRepository.existsById(id)) {

            throw new ResourceNotFoundException(
                    "Card not found with id " + id
            );
        }

        cardRepository.deleteById(id);
    }

    @Transactional
    public CardDTO cloneCard(Long id) {

        Card originalCard =
                cardRepository.findById(id)

                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Card not found with id " + id
                                )
                        );

        Card clonedCard = new Card();

        clonedCard.setTitle(
                originalCard.getTitle()
                        + " - Copy"
        );

        clonedCard.setDescription(
                originalCard.getDescription()
        );

        clonedCard.setIcon(
                originalCard.getIcon()
        );

        clonedCard.setContent(
                originalCard.getContent()
        );

        clonedCard.setActive(
                originalCard.getActive()
        );

        clonedCard.setTrail(
                originalCard.getTrail()
        );

        clonedCard.setSortOrder(
                originalCard.getSortOrder()
        );

        Card savedCard =
                cardRepository.save(clonedCard);

        return new CardDTO(savedCard);
    }


    @Transactional(readOnly = true)
    public UserCardViewDTO findViewById(
            Long id
    ) {

        return cardRepository
                .findViewById(id)

                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Card não encontrado"
                        )
                );
    }
}