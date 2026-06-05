package com.system.UDoc.entity;

import jakarta.persistence.*;
import com.system.UDoc.entity.AuditableEntity;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trail")
public class Trail extends AuditableEntity {

    public enum Visibilidade { INTERNA, EXTERNA, AMBAS }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, columnDefinition = "integer not null default 0")
    private Integer sortOrder = 0;

    /**
     * INTERNA → apenas funcionários internos
     * EXTERNA → apenas funcionários externos
     * AMBAS   → todos os perfis (default)
     * Trilhas inativas nunca aparecem no catálogo independente deste campo.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10, columnDefinition = "varchar(10) default 'AMBAS'")
    private Visibilidade visibilidade = Visibilidade.AMBAS;

    @ManyToMany
    @JoinTable(
            name = "trail_card",
            joinColumns = @JoinColumn(name = "trail_id"),
            inverseJoinColumns = @JoinColumn(name = "card_id")
    )
    private List<Card> cards = new ArrayList<>();

    public Trail() {
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

    public List<Card> getCards() {
        return cards;
    }

    public void setCards(List<Card> cards) {
        this.cards = cards;
    }

    public Visibilidade getVisibilidade() { return visibilidade; }
    public void setVisibilidade(Visibilidade visibilidade) { this.visibilidade = visibilidade; }
}