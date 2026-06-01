package com.system.UDoc.dto;

import jakarta.validation.constraints.*;

public class UserTrailProgressRequestDTO {
    @NotNull private Integer currentItemIndex;
    private String completedItemsJson;
    private String status;
    private Boolean certified;

    public UserTrailProgressRequestDTO() {}
    public Integer getCurrentItemIndex() { return currentItemIndex; } public void setCurrentItemIndex(Integer v) { this.currentItemIndex = v; }
    public String getCompletedItemsJson() { return completedItemsJson; } public void setCompletedItemsJson(String v) { this.completedItemsJson = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public Boolean getCertified() { return certified; } public void setCertified(Boolean v) { this.certified = v; }
}
