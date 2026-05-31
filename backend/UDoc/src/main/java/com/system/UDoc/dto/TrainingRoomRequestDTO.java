package com.system.UDoc.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class TrainingRoomRequestDTO {
    @NotBlank(message = "Title is required") private String title;
    private String description;
    private Long companyId;
    private Long ismId;
    private Long trailId;
    private Integer sortOrder;
    private String status;
    private String vimeoUrl;
    private String youtubeUrl;
    @NotNull(message = "Status is required") private Boolean active;
    private List<Long> invitedEmployeeIds;

    public TrainingRoomRequestDTO() {}
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getIsmId() { return ismId; }
    public void setIsmId(Long ismId) { this.ismId = ismId; }
    public Long getTrailId() { return trailId; }
    public void setTrailId(Long trailId) { this.trailId = trailId; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getVimeoUrl() { return vimeoUrl; }
    public void setVimeoUrl(String vimeoUrl) { this.vimeoUrl = vimeoUrl; }
    public String getYoutubeUrl() { return youtubeUrl; }
    public void setYoutubeUrl(String youtubeUrl) { this.youtubeUrl = youtubeUrl; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public List<Long> getInvitedEmployeeIds() { return invitedEmployeeIds; }
    public void setInvitedEmployeeIds(List<Long> ids) { this.invitedEmployeeIds = ids; }
}
