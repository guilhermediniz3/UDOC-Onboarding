package com.system.UDoc.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "trail_question")
public class TrailQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "trail_id", nullable = false) private Trail trail;
    @Column(nullable = false, columnDefinition = "TEXT") private String enunciado;
    @Column(nullable = false) private String tipo;
    @Column(columnDefinition = "TEXT") private String opcoes;
    @Column(nullable = false) private String respostaCorreta;
    @Column(nullable = false) private Double pontos = 1.0;
    @Column(nullable = false) private Integer ordem = 0;
    public TrailQuestion() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Trail getTrail() { return trail; } public void setTrail(Trail trail) { this.trail = trail; }
    public String getEnunciado() { return enunciado; } public void setEnunciado(String enunciado) { this.enunciado = enunciado; }
    public String getTipo() { return tipo; } public void setTipo(String tipo) { this.tipo = tipo; }
    public String getOpcoes() { return opcoes; } public void setOpcoes(String opcoes) { this.opcoes = opcoes; }
    public String getRespostaCorreta() { return respostaCorreta; } public void setRespostaCorreta(String respostaCorreta) { this.respostaCorreta = respostaCorreta; }
    public Double getPontos() { return pontos; } public void setPontos(Double pontos) { this.pontos = pontos; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer ordem) { this.ordem = ordem; }
}
