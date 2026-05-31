package com.system.UDoc.dto;
import com.system.UDoc.entity.Training;
import java.time.LocalDate;
import java.time.LocalDateTime;
public class TrainingDTO {
    private Long id; private Long companyId; private String companyName; private Long trailId; private String trailName;
    private Long trainingRoomId; private String trainingRoomTitle; private LocalDate dataInicio; private LocalDate dataConclusao; private LocalDateTime createdAt;
    public TrainingDTO() {}
    public TrainingDTO(Training t) {
        this.id = t.getId(); this.dataInicio = t.getDataInicio(); this.dataConclusao = t.getDataConclusao(); this.createdAt = t.getCreatedAt();
        if (t.getCompany() != null) { this.companyId = t.getCompany().getId(); this.companyName = t.getCompany().getName(); }
        if (t.getTrail() != null) { this.trailId = t.getTrail().getId(); this.trailName = t.getTrail().getName(); }
        if (t.getTrainingRoom() != null) { this.trainingRoomId = t.getTrainingRoom().getId(); this.trainingRoomTitle = t.getTrainingRoom().getTitle(); }
    }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getCompanyId() { return companyId; } public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCompanyName() { return companyName; } public void setCompanyName(String companyName) { this.companyName = companyName; }
    public Long getTrailId() { return trailId; } public void setTrailId(Long trailId) { this.trailId = trailId; }
    public String getTrailName() { return trailName; } public void setTrailName(String trailName) { this.trailName = trailName; }
    public Long getTrainingRoomId() { return trainingRoomId; } public void setTrainingRoomId(Long trainingRoomId) { this.trainingRoomId = trainingRoomId; }
    public String getTrainingRoomTitle() { return trainingRoomTitle; } public void setTrainingRoomTitle(String trainingRoomTitle) { this.trainingRoomTitle = trainingRoomTitle; }
    public LocalDate getDataInicio() { return dataInicio; } public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }
    public LocalDate getDataConclusao() { return dataConclusao; } public void setDataConclusao(LocalDate dataConclusao) { this.dataConclusao = dataConclusao; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
