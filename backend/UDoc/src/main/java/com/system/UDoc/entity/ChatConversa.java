package com.system.UDoc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_conversa")
public class ChatConversa {

    public enum Status { ABERTA, ENCERRADA }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private User cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ism_id")
    private Ism ism;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ABERTA;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadaEm = LocalDateTime.now();

    @Column
    private LocalDateTime encerradaEm;

    public ChatConversa() {}

    public Long getId() { return id; }
    public User getCliente() { return cliente; } public void setCliente(User v) { this.cliente = v; }
    public Ism getIsm() { return ism; } public void setIsm(Ism v) { this.ism = v; }
    public Status getStatus() { return status; } public void setStatus(Status v) { this.status = v; }
    public LocalDateTime getCriadaEm() { return criadaEm; }
    public LocalDateTime getEncerradaEm() { return encerradaEm; } public void setEncerradaEm(LocalDateTime v) { this.encerradaEm = v; }
}
