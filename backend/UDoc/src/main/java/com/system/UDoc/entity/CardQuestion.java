package com.system.UDoc.entity;
import jakarta.persistence.*;
import com.system.UDoc.entity.AuditableEntity;
@Entity
@Table(name = "card_question")
public class CardQuestion extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "card_id", nullable = false) private Card card;
    @Column(nullable = false, columnDefinition = "TEXT") private String enunciado;
    @Column(nullable = false) private String tipo; // "vf" | "multipla"
    @Column(columnDefinition = "TEXT") private String opcoes;
    @Column(nullable = false) private String respostaCorreta;
    @Column(nullable = false) private Double pontos = 1.0;
    @Column(nullable = false) private Integer ordem = 0;
    public CardQuestion() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Card getCard() { return card; } public void setCard(Card card) { this.card = card; }
    public String getEnunciado() { return enunciado; } public void setEnunciado(String e) { this.enunciado = e; }
    public String getTipo() { return tipo; } public void setTipo(String t) { this.tipo = t; }
    public String getOpcoes() { return opcoes; } public void setOpcoes(String o) { this.opcoes = o; }
    public String getRespostaCorreta() { return respostaCorreta; } public void setRespostaCorreta(String r) { this.respostaCorreta = r; }
    public Double getPontos() { return pontos; } public void setPontos(Double p) { this.pontos = p; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer o) { this.ordem = o; }
}
