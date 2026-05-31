package com.system.UDoc.dto;

import com.system.UDoc.entity.Card;

public class CardDTO {

    private Long id;
    private String title;
    private String description;
    private String icon;
    private String content;
    private Boolean active;
    private Boolean trail;
    private Integer sortOrder;

    public CardDTO() {
    }

    public CardDTO(Card card) {

        this.id = card.getId();
        this.title = card.getTitle();
        this.description = card.getDescription();
        this.icon = card.getIcon();
        this.content = card.getContent();
        this.active = card.getActive();
        this.trail = card.getTrail();
        this.sortOrder = card.getSortOrder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }


    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Boolean getTrail() {
        return trail;
    }

    public void setTrail(Boolean trail) {
        this.trail = trail;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}