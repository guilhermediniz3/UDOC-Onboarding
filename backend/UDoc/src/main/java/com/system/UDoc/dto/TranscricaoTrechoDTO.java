package com.system.UDoc.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.system.UDoc.entity.TranscricaoTrecho;
import java.time.LocalDateTime;

public class TranscricaoTrechoDTO {

    private Long id;
    private Long trainingRoomId;
    private Long usuarioId;
    private String texto;
    private LocalDateTime timestamp;

    public TranscricaoTrechoDTO() {}

    private Long sessaoId;

    public TranscricaoTrechoDTO(TranscricaoTrecho t) {
        this.id = t.getId();
        this.trainingRoomId = t.getTrainingRoomId();
        this.usuarioId = t.getUsuarioId();
        this.sessaoId = t.getSessaoId();
        this.texto = t.getTexto();
        this.timestamp = t.getTimestamp();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTrainingRoomId() { return trainingRoomId; }
    public void setTrainingRoomId(Long trainingRoomId) { this.trainingRoomId = trainingRoomId; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public Long getSessaoId() { return sessaoId; }
    public void setSessaoId(Long sessaoId) { this.sessaoId = sessaoId; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
