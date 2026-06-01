package com.system.UDoc.dto;

public class KanbanEmployeeEntryDTO {
    private Long employeeId;
    private String employeeName;
    private Double notaObtida;
    private Boolean aprovado;
    private Boolean completedTrail;   // concluiu a trilha
    private Boolean certifiedTrail;   // passou no quiz da trilha

    public KanbanEmployeeEntryDTO() {}

    public KanbanEmployeeEntryDTO(Long employeeId, String employeeName, Double notaObtida, Boolean aprovado) {
        this.employeeId = employeeId; this.employeeName = employeeName;
        this.notaObtida = notaObtida; this.aprovado = aprovado;
        this.completedTrail = false; this.certifiedTrail = false;
    }

    public Long getEmployeeId() { return employeeId; } public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; } public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public Double getNotaObtida() { return notaObtida; } public void setNotaObtida(Double notaObtida) { this.notaObtida = notaObtida; }
    public Boolean getAprovado() { return aprovado; } public void setAprovado(Boolean aprovado) { this.aprovado = aprovado; }
    public Boolean getCompletedTrail() { return completedTrail; } public void setCompletedTrail(Boolean v) { this.completedTrail = v; }
    public Boolean getCertifiedTrail() { return certifiedTrail; } public void setCertifiedTrail(Boolean v) { this.certifiedTrail = v; }
}
