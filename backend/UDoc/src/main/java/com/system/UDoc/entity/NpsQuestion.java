package com.system.UDoc.entity;
import jakarta.persistence.*;
import com.system.UDoc.entity.AuditableEntity;
@Entity
@Table(name = "nps_question")
public class NpsQuestion extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String referenceType; // "card" | "trail"
    @Column(nullable = false) private Long referenceId;
    @Column(nullable = false, columnDefinition = "TEXT") private String enunciado;
    @Column(nullable = false) private String tipo; // "faces" | "text"
    @Column(nullable = false) private Integer ordem = 0;
    public NpsQuestion() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getReferenceType() { return referenceType; } public void setReferenceType(String r) { this.referenceType = r; }
    public Long getReferenceId() { return referenceId; } public void setReferenceId(Long r) { this.referenceId = r; }
    public String getEnunciado() { return enunciado; } public void setEnunciado(String e) { this.enunciado = e; }
    public String getTipo() { return tipo; } public void setTipo(String t) { this.tipo = t; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer o) { this.ordem = o; }
}
