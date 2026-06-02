package com.system.UDoc.dto;

import java.time.LocalDateTime;

public class CertificateInfoDTO {
    private Long trailId;
    private String trailName;
    private String trailDescription;
    private Double notaObtida;
    private Long tempoTotalSegundos;
    private LocalDateTime iniciadoEm;
    private LocalDateTime concluidoEm;
    private String employeeName;
    private String companyName;
    private String ismName;

    public CertificateInfoDTO() {}

    public Long getTrailId() { return trailId; } public void setTrailId(Long v) { this.trailId = v; }
    public String getTrailName() { return trailName; } public void setTrailName(String v) { this.trailName = v; }
    public String getTrailDescription() { return trailDescription; } public void setTrailDescription(String v) { this.trailDescription = v; }
    public Double getNotaObtida() { return notaObtida; } public void setNotaObtida(Double v) { this.notaObtida = v; }
    public Long getTempoTotalSegundos() { return tempoTotalSegundos; } public void setTempoTotalSegundos(Long v) { this.tempoTotalSegundos = v; }
    public LocalDateTime getIniciadoEm() { return iniciadoEm; } public void setIniciadoEm(LocalDateTime v) { this.iniciadoEm = v; }
    public LocalDateTime getConcluidoEm() { return concluidoEm; } public void setConcluidoEm(LocalDateTime v) { this.concluidoEm = v; }
    public String getEmployeeName() { return employeeName; } public void setEmployeeName(String v) { this.employeeName = v; }
    public String getCompanyName() { return companyName; } public void setCompanyName(String v) { this.companyName = v; }
    public String getIsmName() { return ismName; } public void setIsmName(String v) { this.ismName = v; }
}
