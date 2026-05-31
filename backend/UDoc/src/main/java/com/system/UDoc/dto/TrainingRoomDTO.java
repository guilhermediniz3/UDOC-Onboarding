package com.system.UDoc.dto;

import com.system.UDoc.entity.Employee;
import com.system.UDoc.entity.TrainingRoom;

import java.time.LocalDateTime;
import java.util.List;

public class TrainingRoomDTO {
    private Long id;
    private String title;
    private String description;
    private Long companyId;
    private String companyName;
    private Long ismId;
    private String ismName;
    private Long trailId;
    private String trailName;
    private Integer sortOrder;
    private String status;
    private String vimeoUrl;
    private String youtubeUrl;
    private String jitsiRoomId;
    private Boolean active;
    private LocalDateTime createdAt;
    private List<Long> invitedEmployeeIds;
    private List<String> invitedEmployeeNames;

    public TrainingRoomDTO() {}
    public TrainingRoomDTO(TrainingRoom r) {
        this.id = r.getId(); this.title = r.getTitle(); this.description = r.getDescription();
        this.sortOrder = r.getSortOrder(); this.status = r.getStatus().name();
        this.vimeoUrl = r.getVimeoUrl(); this.youtubeUrl = r.getYoutubeUrl();
        this.jitsiRoomId = r.getJitsiRoomId(); this.active = r.getActive(); this.createdAt = r.getCreatedAt();
        if (r.getCompany() != null) { this.companyId = r.getCompany().getId(); this.companyName = r.getCompany().getName(); }
        if (r.getIsm() != null) { this.ismId = r.getIsm().getId(); this.ismName = r.getIsm().getName(); }
        if (r.getTrail() != null) { this.trailId = r.getTrail().getId(); this.trailName = r.getTrail().getName(); }
        if (r.getInvitedEmployees() != null) {
            this.invitedEmployeeIds = r.getInvitedEmployees().stream().map(Employee::getId).toList();
            this.invitedEmployeeNames = r.getInvitedEmployees().stream().map(Employee::getName).toList();
        }
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public Long getIsmId() { return ismId; }
    public void setIsmId(Long ismId) { this.ismId = ismId; }
    public String getIsmName() { return ismName; }
    public void setIsmName(String ismName) { this.ismName = ismName; }
    public Long getTrailId() { return trailId; }
    public void setTrailId(Long trailId) { this.trailId = trailId; }
    public String getTrailName() { return trailName; }
    public void setTrailName(String trailName) { this.trailName = trailName; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getVimeoUrl() { return vimeoUrl; }
    public void setVimeoUrl(String vimeoUrl) { this.vimeoUrl = vimeoUrl; }
    public String getYoutubeUrl() { return youtubeUrl; }
    public void setYoutubeUrl(String youtubeUrl) { this.youtubeUrl = youtubeUrl; }
    public String getJitsiRoomId() { return jitsiRoomId; }
    public void setJitsiRoomId(String jitsiRoomId) { this.jitsiRoomId = jitsiRoomId; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<Long> getInvitedEmployeeIds() { return invitedEmployeeIds; }
    public void setInvitedEmployeeIds(List<Long> ids) { this.invitedEmployeeIds = ids; }
    public List<String> getInvitedEmployeeNames() { return invitedEmployeeNames; }
    public void setInvitedEmployeeNames(List<String> names) { this.invitedEmployeeNames = names; }
}
