package com.system.UDoc.dto;

import com.system.UDoc.entity.UserTrailProgress;
import java.time.LocalDateTime;

public class UserTrailProgressDTO {
    private Long trailId;
    private Integer currentItemIndex;
    private String completedItemsJson;
    private String status;
    private Boolean certified;
    private Long tempoTotalSegundos;
    private LocalDateTime iniciadoEm;
    private LocalDateTime concluidoEm;

    public UserTrailProgressDTO() {}

    public UserTrailProgressDTO(UserTrailProgress p) {
        this.trailId = p.getTrailId();
        this.currentItemIndex = p.getCurrentItemIndex();
        this.completedItemsJson = p.getCompletedItemsJson();
        this.status = p.getStatus();
        this.certified = p.getCertified();
        this.tempoTotalSegundos = p.getTempoTotalSegundos() != null ? p.getTempoTotalSegundos() : 0L;
        this.iniciadoEm = p.getIniciadoEm();
        this.concluidoEm = p.getConcluidoEm();
    }

    public Long getTrailId() { return trailId; } public void setTrailId(Long v) { this.trailId = v; }
    public Integer getCurrentItemIndex() { return currentItemIndex; } public void setCurrentItemIndex(Integer v) { this.currentItemIndex = v; }
    public String getCompletedItemsJson() { return completedItemsJson; } public void setCompletedItemsJson(String v) { this.completedItemsJson = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public Boolean getCertified() { return certified; } public void setCertified(Boolean v) { this.certified = v; }
    public Long getTempoTotalSegundos() { return tempoTotalSegundos; } public void setTempoTotalSegundos(Long v) { this.tempoTotalSegundos = v; }
    public LocalDateTime getIniciadoEm() { return iniciadoEm; } public void setIniciadoEm(LocalDateTime v) { this.iniciadoEm = v; }
    public LocalDateTime getConcluidoEm() { return concluidoEm; } public void setConcluidoEm(LocalDateTime v) { this.concluidoEm = v; }
}
