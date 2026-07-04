package com.system.UDoc.dto;

public class TranscricaoTrechoRequestDTO {

    private Long trainingRoomId;
    private String texto;

    public TranscricaoTrechoRequestDTO() {}

    public Long getTrainingRoomId() { return trainingRoomId; }
    public void setTrainingRoomId(Long trainingRoomId) { this.trainingRoomId = trainingRoomId; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
}
