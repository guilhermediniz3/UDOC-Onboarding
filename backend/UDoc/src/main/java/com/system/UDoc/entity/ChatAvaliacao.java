package com.system.UDoc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_avaliacao")
public class ChatAvaliacao {

    public enum TipoChat { IA, ISM }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversa_id", nullable = false)
    private ChatConversa conversa;

    /** Nota de 1 a 4: 1=Ruim 2=Normal 3=Bom 4=Muito satisfeito */
    @Column(nullable = false)
    private Integer nota;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoChat tipo;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadaEm = LocalDateTime.now();

    public ChatAvaliacao() {}

    public Long getId() { return id; }
    public ChatConversa getConversa() { return conversa; } public void setConversa(ChatConversa v) { this.conversa = v; }
    public Integer getNota() { return nota; } public void setNota(Integer v) { this.nota = v; }
    public TipoChat getTipo() { return tipo; } public void setTipo(TipoChat v) { this.tipo = v; }
    public LocalDateTime getCriadaEm() { return criadaEm; }
}
