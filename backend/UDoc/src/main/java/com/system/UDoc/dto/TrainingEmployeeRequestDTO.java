package com.system.UDoc.dto;
import jakarta.validation.constraints.*;
public class TrainingEmployeeRequestDTO {
    @NotNull(message = "employeeId e obrigatorio") private Long employeeId;
    private Double notaObtida;
    @NotNull(message = "aprovado e obrigatorio") private Boolean aprovado;
    public TrainingEmployeeRequestDTO() {}
    public Long getEmployeeId() { return employeeId; } public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Double getNotaObtida() { return notaObtida; } public void setNotaObtida(Double notaObtida) { this.notaObtida = notaObtida; }
    public Boolean getAprovado() { return aprovado; } public void setAprovado(Boolean aprovado) { this.aprovado = aprovado; }
}
