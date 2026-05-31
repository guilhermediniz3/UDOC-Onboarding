package com.system.UDoc.dto;
import com.system.UDoc.entity.TrainingEmployee;
public class TrainingEmployeeDTO {
    private Long id; private Long trainingId; private Long employeeId; private String employeeName; private Double notaObtida; private Boolean aprovado;
    public TrainingEmployeeDTO() {}
    public TrainingEmployeeDTO(TrainingEmployee te) {
        this.id = te.getId(); this.trainingId = te.getTraining().getId(); this.aprovado = te.getAprovado(); this.notaObtida = te.getNotaObtida();
        if (te.getEmployee() != null) { this.employeeId = te.getEmployee().getId(); this.employeeName = te.getEmployee().getName(); }
    }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getTrainingId() { return trainingId; } public void setTrainingId(Long trainingId) { this.trainingId = trainingId; }
    public Long getEmployeeId() { return employeeId; } public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; } public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public Double getNotaObtida() { return notaObtida; } public void setNotaObtida(Double notaObtida) { this.notaObtida = notaObtida; }
    public Boolean getAprovado() { return aprovado; } public void setAprovado(Boolean aprovado) { this.aprovado = aprovado; }
}
