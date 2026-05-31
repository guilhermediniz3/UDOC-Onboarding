package com.system.UDoc.dto;
import java.time.LocalDate;
import java.util.List;
public class KanbanCompanyEntryDTO {
    private Long companyId; private String companyName; private Long trainingId;
    private LocalDate dataInicio; private LocalDate dataConclusao; private Boolean aprovado;
    private List<KanbanEmployeeEntryDTO> funcionarios;
    public KanbanCompanyEntryDTO() {}
    public Long getCompanyId() { return companyId; } public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCompanyName() { return companyName; } public void setCompanyName(String companyName) { this.companyName = companyName; }
    public Long getTrainingId() { return trainingId; } public void setTrainingId(Long trainingId) { this.trainingId = trainingId; }
    public LocalDate getDataInicio() { return dataInicio; } public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }
    public LocalDate getDataConclusao() { return dataConclusao; } public void setDataConclusao(LocalDate dataConclusao) { this.dataConclusao = dataConclusao; }
    public Boolean getAprovado() { return aprovado; } public void setAprovado(Boolean aprovado) { this.aprovado = aprovado; }
    public List<KanbanEmployeeEntryDTO> getFuncionarios() { return funcionarios; } public void setFuncionarios(List<KanbanEmployeeEntryDTO> funcionarios) { this.funcionarios = funcionarios; }
}
