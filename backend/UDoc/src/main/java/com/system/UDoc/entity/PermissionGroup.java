package com.system.UDoc.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "permission_groups")
public class PermissionGroup extends AuditableEntity {

    public enum GroupType { FUNCIONARIO_INTERNO, FUNCIONARIO_EXTERNO, ISM }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 30)
    private GroupType groupType;

    @Column(nullable = false, length = 255)
    private String description;

    public PermissionGroup() {}
    public PermissionGroup(GroupType groupType, String description) {
        this.groupType   = groupType;
        this.description = description;
    }

    public Long      getId()          { return id; }
    public GroupType getGroupType()   { return groupType; }
    public String    getDescription() { return description; }
}
