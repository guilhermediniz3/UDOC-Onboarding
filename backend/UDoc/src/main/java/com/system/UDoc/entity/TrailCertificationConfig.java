package com.system.UDoc.entity;
import jakarta.persistence.*;
import com.system.UDoc.entity.AuditableEntity;
@Entity
@Table(name = "trail_certification_config")
public class TrailCertificationConfig extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "trail_id", nullable = false, unique = true) private Trail trail;
    @Column(nullable = false) private Double notaMinima = 7.0;
    public TrailCertificationConfig() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Trail getTrail() { return trail; } public void setTrail(Trail trail) { this.trail = trail; }
    public Double getNotaMinima() { return notaMinima; } public void setNotaMinima(Double notaMinima) { this.notaMinima = notaMinima; }
}
