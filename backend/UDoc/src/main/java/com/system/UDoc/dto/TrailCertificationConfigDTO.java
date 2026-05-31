package com.system.UDoc.dto;
import com.system.UDoc.entity.TrailCertificationConfig;
public class TrailCertificationConfigDTO {
    private Long id; private Long trailId; private Double notaMinima; private Double totalPontos; private Integer quantidadePerguntas;
    public TrailCertificationConfigDTO() {}
    public TrailCertificationConfigDTO(TrailCertificationConfig c, Double totalPontos, int qtd) {
        this.id = c.getId(); this.trailId = c.getTrail().getId(); this.notaMinima = c.getNotaMinima();
        this.totalPontos = totalPontos != null ? totalPontos : 0.0; this.quantidadePerguntas = qtd;
    }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getTrailId() { return trailId; } public void setTrailId(Long trailId) { this.trailId = trailId; }
    public Double getNotaMinima() { return notaMinima; } public void setNotaMinima(Double notaMinima) { this.notaMinima = notaMinima; }
    public Double getTotalPontos() { return totalPontos; } public void setTotalPontos(Double totalPontos) { this.totalPontos = totalPontos; }
    public Integer getQuantidadePerguntas() { return quantidadePerguntas; } public void setQuantidadePerguntas(Integer quantidadePerguntas) { this.quantidadePerguntas = quantidadePerguntas; }
}
