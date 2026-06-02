package com.system.UDoc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_trail_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "trail_id"}))
public class UserTrailProgress {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(nullable = false) private Long trailId;
    @Column(nullable = false) private Integer currentItemIndex = 0;
    @Column(columnDefinition = "TEXT") private String completedItemsJson = "[]";
    @Column(nullable = false) private String status = "in_progress";

    @Column(columnDefinition = "boolean default false")
    private Boolean certified = false;

    /** Nota obtida no quiz de certificação (0-100) */
    @Column
    private Double notaObtida;

    /** Tempo total acumulado em segundos de todas as sessões */
    @Column(columnDefinition = "bigint default 0")
    private Long tempoTotalSegundos = 0L;

    /** Data/hora do primeiro acesso à trilha */
    @Column
    private LocalDateTime iniciadoEm;

    /** Data/hora de conclusão da trilha */
    @Column
    private LocalDateTime concluidoEm;

    @Column(nullable = false) private LocalDateTime updatedAt = LocalDateTime.now();

    public UserTrailProgress() {}

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public User getUser() { return user; } public void setUser(User user) { this.user = user; }
    public Long getTrailId() { return trailId; } public void setTrailId(Long trailId) { this.trailId = trailId; }
    public Integer getCurrentItemIndex() { return currentItemIndex; } public void setCurrentItemIndex(Integer v) { this.currentItemIndex = v; }
    public String getCompletedItemsJson() { return completedItemsJson; } public void setCompletedItemsJson(String v) { this.completedItemsJson = v; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Boolean getCertified() { return certified; } public void setCertified(Boolean certified) { this.certified = certified; }
    public Double getNotaObtida() { return notaObtida; } public void setNotaObtida(Double v) { this.notaObtida = v; }
    public Long getTempoTotalSegundos() { return tempoTotalSegundos; } public void setTempoTotalSegundos(Long v) { this.tempoTotalSegundos = v; }
    public LocalDateTime getIniciadoEm() { return iniciadoEm; } public void setIniciadoEm(LocalDateTime v) { this.iniciadoEm = v; }
    public LocalDateTime getConcluidoEm() { return concluidoEm; } public void setConcluidoEm(LocalDateTime v) { this.concluidoEm = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; } public void setUpdatedAt(LocalDateTime v) { this.updatedAt = v; }
}
