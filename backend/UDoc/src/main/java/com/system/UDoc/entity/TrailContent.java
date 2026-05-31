package com.system.UDoc.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "trail_content")
public class TrailContent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "trail_id", nullable = false) private Trail trail;
    @Column(nullable = false) private String tipo;
    @Column(nullable = false) private Long referenciaId;
    @Column(nullable = false) private Integer ordem = 0;
    public TrailContent() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Trail getTrail() { return trail; } public void setTrail(Trail trail) { this.trail = trail; }
    public String getTipo() { return tipo; } public void setTipo(String tipo) { this.tipo = tipo; }
    public Long getReferenciaId() { return referenciaId; } public void setReferenciaId(Long referenciaId) { this.referenciaId = referenciaId; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer ordem) { this.ordem = ordem; }
}
