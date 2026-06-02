package com.system.UDoc.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "card")
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String icon;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, columnDefinition = "bigint not null default 0")
    private Long accessCount = 0L;

    @Column(nullable = false, columnDefinition = "boolean not null default false")
    private Boolean trail = false;

    @Column(nullable = false, columnDefinition = "integer not null default 0")
    private Integer sortOrder = 0;

    /** Card interno: visível apenas para funcionários internos e admins, não para funcionários externos */
    @Column(nullable = false, columnDefinition = "boolean not null default false")
    private Boolean interno = false;


    public Card() {
    }

    public Card(
            Long id,
            String title,
            String description,
            String icon,
            String content,
            Boolean active,
            Boolean trail,
            Integer sortOrder
    ) {

        this.id = id;
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.content = content;
        this.active = active;
        this.trail = trail;
        this.sortOrder = sortOrder;
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
    public Long getAccessCount() { return accessCount; }
    public void setAccessCount(Long accessCount) { this.accessCount = accessCount; }
    public Boolean getInterno() { return interno != null && interno; }
    public void setInterno(Boolean interno) { this.interno = interno != null && interno; }
}
