package com.system.UDoc.dto;
public class KanbanEmployeeEntryDTO {
    private Long employeeId; private String employeeName; private Double notaObtida; private Boolean aprovado;
    public KanbanEmployeeEntryDTO() {}
    public KanbanEmployeeEntryDTO(Long employeeId, String employeeName, Double notaObtida, Boolean aprovado) {
        this.employeeId = employeeId; this.employeeName = employeeName; this.notaObtida = notaObtida; this.aprovado = aprovado;
    }
    public Long getEmployeeId() { return employeeId; } public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; } public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public Double getNotaObtida() { return notaObtida; } public void setNotaObtida(Double notaObtida) { this.notaObtida = notaObtida; }
    public Boolean getAprovado() { return aprovado; } public void setAprovado(Boolean aprovado) { this.aprovado = aprovado; }
}
