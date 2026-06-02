package com.system.UDoc.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "nps_config",
    uniqueConstraints = @UniqueConstraint(columnNames = {"reference_type", "reference_id"}))
public class NpsConfig {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_type", nullable = false)
    private String referenceType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean enabled = true;

    public NpsConfig() {}

    public Long getId() { return id; }
    public String getReferenceType() { return referenceType; } public void setReferenceType(String v) { this.referenceType = v; }
    public Long getReferenceId() { return referenceId; } public void setReferenceId(Long v) { this.referenceId = v; }
    public Boolean getEnabled() { return enabled; } public void setEnabled(Boolean v) { this.enabled = v; }
}
