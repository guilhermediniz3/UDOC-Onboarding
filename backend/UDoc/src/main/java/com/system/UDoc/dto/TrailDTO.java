package com.system.UDoc.dto;

import com.system.UDoc.entity.Trail;

import java.util.List;
import java.util.stream.Collectors;

public class TrailDTO {

    private Long id;
    private String name;
    private String description;
    private Boolean active;
    private Integer sortOrder;
    private List<CardDTO> cards;

    public TrailDTO() {
    }

    public TrailDTO(Trail trail) {

        this.id = trail.getId();
        this.name = trail.getName();
        this.description = trail.getDescription();
        this.active = trail.getActive();
        this.sortOrder = trail.getSortOrder();
        this.cards = trail.getCards()
                .stream()
                .map(CardDTO::new)
                .collect(Collectors.toList());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public List<CardDTO> getCards() {
        return cards;
    }

    public void setCards(List<CardDTO> cards) {
        this.cards = cards;
    }
}