package com.system.UDoc.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.system.UDoc.entity.Rat;
import com.system.UDoc.entity.SessaoTreinamento;
import java.time.LocalDateTime;

public class SessaoTreinamentoDTO {

    private Long id;
    private Long trainingRoomId;
    private String trainingRoomTitle;
    private LocalDateTime dataHoraInicio;
    private LocalDateTime dataHoraFim;
    private String status;
    private Long criadoPorId;
    private String criadoPorName;
    // "SEM_RAT", "RASCUNHO" ou "FINALIZADO"
    private String ratStatus;
    private Long ratId;

    public SessaoTreinamentoDTO() {}

    public SessaoTreinamentoDTO(SessaoTreinamento s, Rat rat) {
        this.id = s.getId();
        if (s.getTrainingRoom() != null) {
            this.trainingRoomId = s.getTrainingRoom().getId();
            this.trainingRoomTitle = s.getTrainingRoom().getTitle();
        }
        this.dataHoraInicio = s.getDataHoraInicio();
        this.dataHoraFim = s.getDataHoraFim();
        this.status = s.getStatus() != null ? s.getStatus().name() : null;
        if (s.getCriadoPor() != null) {
            this.criadoPorId = s.getCriadoPor().getId();
            this.criadoPorName = s.getCriadoPor().getName();
        }
        if (rat != null) {
            this.ratId = rat.getId();
            this.ratStatus = rat.getStatus() != null ? rat.getStatus().name() : "FINALIZADO";
        } else {
            this.ratStatus = "SEM_RAT";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTrainingRoomId() { return trainingRoomId; }
    public void setTrainingRoomId(Long trainingRoomId) { this.trainingRoomId = trainingRoomId; }
    public String getTrainingRoomTitle() { return trainingRoomTitle; }
    public void setTrainingRoomTitle(String trainingRoomTitle) { this.trainingRoomTitle = trainingRoomTitle; }

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    public LocalDateTime getDataHoraInicio() { return dataHoraInicio; }
    public void setDataHoraInicio(LocalDateTime dataHoraInicio) { this.dataHoraInicio = dataHoraInicio; }

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    public LocalDateTime getDataHoraFim() { return dataHoraFim; }
    public void setDataHoraFim(LocalDateTime dataHoraFim) { this.dataHoraFim = dataHoraFim; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getCriadoPorId() { return criadoPorId; }
    public void setCriadoPorId(Long criadoPorId) { this.criadoPorId = criadoPorId; }
    public String getCriadoPorName() { return criadoPorName; }
    public void setCriadoPorName(String criadoPorName) { this.criadoPorName = criadoPorName; }
    public String getRatStatus() { return ratStatus; }
    public void setRatStatus(String ratStatus) { this.ratStatus = ratStatus; }
    public Long getRatId() { return ratId; }
    public void setRatId(Long ratId) { this.ratId = ratId; }
}
