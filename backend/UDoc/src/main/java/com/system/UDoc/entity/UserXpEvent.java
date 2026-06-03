package com.system.UDoc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_xp_events")
public class UserXpEvent {

    public enum EventType {
        CARD_COMPLETED,
        TRAIL_COMPLETED,
        PERFECT_SCORE,
        DAILY_ACCESS,
        CERTIFICATE_ISSUED
    }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventType eventType;

    @Column(nullable = false)
    private Integer xp;

    @Column
    private Long referenceId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(length = 255)
    private String createdBy;

    public UserXpEvent() {}

    public UserXpEvent(Long userId, EventType eventType, Integer xp, Long referenceId, String createdBy) {
        this.userId      = userId;
        this.eventType   = eventType;
        this.xp          = xp;
        this.referenceId = referenceId;
        this.createdBy   = createdBy;
    }

    public Long        getId()          { return id; }
    public Long        getUserId()      { return userId; }
    public EventType   getEventType()   { return eventType; }
    public Integer     getXp()          { return xp; }
    public Long        getReferenceId() { return referenceId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String      getCreatedBy()   { return createdBy; }
}
