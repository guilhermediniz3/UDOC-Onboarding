package com.system.UDoc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    public enum NotifType { CARD_CREATED, CARD_UPDATED, TRAIL_CREATED, TRAIL_UPDATED }
    public enum RefType   { CARD, TRAIL }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotifType type;

    @Column(nullable = false)
    private String title;

    @Column
    private Long referenceId;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private RefType referenceType;

    @Column(nullable = false)
    private Boolean read = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(length = 255)
    private String createdBy;

    public Notification() {}

    public Notification(Long userId, NotifType type, String title,
                        Long referenceId, RefType refType, String createdBy) {
        this.userId        = userId;
        this.type          = type;
        this.title         = title;
        this.referenceId   = referenceId;
        this.referenceType = refType;
        this.createdBy     = createdBy;
    }

    public Long          getId()            { return id; }
    public Long          getUserId()        { return userId; }
    public NotifType     getType()          { return type; }
    public String        getTitle()         { return title; }
    public Long          getReferenceId()   { return referenceId; }
    public RefType       getReferenceType() { return referenceType; }
    public Boolean       getRead()          { return read; }
    public void          setRead(Boolean v) { this.read = v; }
    public LocalDateTime getCreatedAt()     { return createdAt; }
    public String        getCreatedBy()     { return createdBy; }
}
