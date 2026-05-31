package com.system.UDoc.dto;
import com.system.UDoc.entity.TrailContent;
public class TrailContentDTO {
    private Long id; private Long trailId; private String tipo; private Long referenciaId; private Integer ordem; private String nome;
    public TrailContentDTO() {}
    public TrailContentDTO(TrailContent c, String nome) {
        this.id = c.getId(); this.trailId = c.getTrail().getId(); this.tipo = c.getTipo();
        this.referenciaId = c.getReferenciaId(); this.ordem = c.getOrdem(); this.nome = nome;
    }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getTrailId() { return trailId; } public void setTrailId(Long trailId) { this.trailId = trailId; }
    public String getTipo() { return tipo; } public void setTipo(String tipo) { this.tipo = tipo; }
    public Long getReferenciaId() { return referenciaId; } public void setReferenciaId(Long referenciaId) { this.referenciaId = referenciaId; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer ordem) { this.ordem = ordem; }
    public String getNome() { return nome; } public void setNome(String nome) { this.nome = nome; }
}
