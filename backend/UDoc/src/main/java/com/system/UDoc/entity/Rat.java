package com.system.UDoc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "rat")
public class Rat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_room_id", nullable = false)
    private TrainingRoom trainingRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ism_id")
    private Ism ism;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id")
    private User autor;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sessao_id")
    private SessaoTreinamento sessao;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'FINALIZADO'")
    private RatStatus status;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    @Column(nullable = false)
    private LocalDateTime dataCriacao;

    public Rat() {}

    @PrePersist
    private void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now(ZoneOffset.UTC);
        }
        if (status == null) {
            status = RatStatus.FINALIZADO;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TrainingRoom getTrainingRoom() { return trainingRoom; }
    public void setTrainingRoom(TrainingRoom trainingRoom) { this.trainingRoom = trainingRoom; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public Ism getIsm() { return ism; }
    public void setIsm(Ism ism) { this.ism = ism; }
    public User getAutor() { return autor; }
    public void setAutor(User autor) { this.autor = autor; }
    public SessaoTreinamento getSessao() { return sessao; }
    public void setSessao(SessaoTreinamento sessao) { this.sessao = sessao; }
    public RatStatus getStatus() { return status; }
    public void setStatus(RatStatus status) { this.status = status; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }
    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
}
