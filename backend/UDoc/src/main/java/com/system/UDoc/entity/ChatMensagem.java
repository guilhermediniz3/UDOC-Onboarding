package com.system.UDoc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_mensagem")
public class ChatMensagem {

    public enum Tipo { CLIENTE, ISM, IA, SISTEMA }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversa_id", nullable = false)
    private ChatConversa conversa;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Tipo tipo;

    @Column(nullable = false)
    private Boolean lida = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataHora = LocalDateTime.now();

    public ChatMensagem() {}

    public Long getId() { return id; }
    public ChatConversa getConversa() { return conversa; } public void setConversa(ChatConversa v) { this.conversa = v; }
    public String getConteudo() { return conteudo; } public void setConteudo(String v) { this.conteudo = v; }
    public Tipo getTipo() { return tipo; } public void setTipo(Tipo v) { this.tipo = v; }
    public Boolean getLida() { return lida; } public void setLida(Boolean v) { this.lida = v; }
    public LocalDateTime getDataHora() { return dataHora; }
}
