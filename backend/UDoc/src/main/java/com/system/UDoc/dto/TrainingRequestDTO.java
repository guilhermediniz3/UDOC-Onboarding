package com.system.UDoc.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
public class TrainingRequestDTO {
    @NotNull(message = "companyId e obrigatorio") private Long companyId;
    @NotNull(message = "trailId e obrigatorio") private Long trailId;
    private Long trainingRoomId; private LocalDate dataInicio; private LocalDate dataConclusao;
    public TrainingRequestDTO() {}
    public Long getCompanyId() { return companyId; } public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getTrailId() { return trailId; } public void setTrailId(Long trailId) { this.trailId = trailId; }
    public Long getTrainingRoomId() { return trainingRoomId; } public void setTrainingRoomId(Long trainingRoomId) { this.trainingRoomId = trainingRoomId; }
    public LocalDate getDataInicio() { return dataInicio; } public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }
    public LocalDate getDataConclusao() { return dataConclusao; } public void setDataConclusao(LocalDate dataConclusao) { this.dataConclusao = dataConclusao; }
}
