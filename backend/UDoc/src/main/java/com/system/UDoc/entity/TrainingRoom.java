package com.system.UDoc.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "training_room")
public class TrainingRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ism_id")
    private Ism ism;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trail_id")
    private Trail trail;

    @Column
    private Integer sortOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainingRoomStatus status = TrainingRoomStatus.AGENDADA;

    @Column
    private String vimeoUrl;

    @Column
    private String youtubeUrl;

    @Column(nullable = false, unique = true)
    private String jitsiRoomId;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToMany
    @JoinTable(
            name = "training_room_employee",
            joinColumns = @JoinColumn(name = "training_room_id"),
            inverseJoinColumns = @JoinColumn(name = "employee_id")
    )
    private List<Employee> invitedEmployees = new ArrayList<>();

    @PrePersist
    private void prePersist() {
        if (jitsiRoomId == null || jitsiRoomId.isBlank()) {
            jitsiRoomId = "udoc-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }
    }

    public TrainingRoom() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public Ism getIsm() { return ism; }
    public void setIsm(Ism ism) { this.ism = ism; }
    public Trail getTrail() { return trail; }
    public void setTrail(Trail trail) { this.trail = trail; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public TrainingRoomStatus getStatus() { return status; }
    public void setStatus(TrainingRoomStatus status) { this.status = status; }
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
    public List<Employee> getInvitedEmployees() { return invitedEmployees; }
    public void setInvitedEmployees(List<Employee> invitedEmployees) { this.invitedEmployees = invitedEmployees; }
}
