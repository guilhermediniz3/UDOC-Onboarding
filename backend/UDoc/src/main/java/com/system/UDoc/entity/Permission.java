package com.system.UDoc.entity;

import com.system.UDoc.entity.PermissionGroup.GroupType;
import jakarta.persistence.*;

@Entity
@Table(name = "permissions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "module", "action"}))
public class Permission extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private PermissionGroup group;

    /** Ex: CARD, TRILHA, SALA, FUNCIONARIO, USUARIO, EMPRESA, ISM, TRAINING */
    @Column(nullable = false, length = 50)
    private String module;

    /** VIEW | CREATE | EDIT | DELETE — extensível no futuro */
    @Column(nullable = false, length = 20)
    private String action;

    /** Default true — tudo concedido por padrão */
    @Column(nullable = false)
    private Boolean granted = true;

    /**
     * Marca permissões que envolvem recursos de outro ISM
     * (ex: editar sala de outro ISM, alterar ISM responsável de funcionário externo).
     * Exibidas com ícone ⚠️ e descrição na tela de configuração.
     */
    @Column(nullable = false)
    private Boolean sensitive = false;

    /** Descrição exibida na UI para permissões sensíveis que precisam de contexto. */
    @Column(columnDefinition = "TEXT")
    private String description;

    public Permission() {}

    public Permission(PermissionGroup group, String module, String action,
                      boolean granted, boolean sensitive) {
        this.group     = group;
        this.module    = module;
        this.action    = action;
        this.granted   = granted;
        this.sensitive = sensitive;
    }

    public Permission(PermissionGroup group, String module, String action,
                      boolean granted, boolean sensitive, String description) {
        this(group, module, action, granted, sensitive);
        this.description = description;
    }

    public Long            getId()          { return id; }
    public PermissionGroup getGroup()       { return group; }
    public GroupType       getGroupType()   { return group.getGroupType(); }
    public String          getModule()      { return module; }
    public String          getAction()      { return action; }
    public Boolean         getGranted()     { return granted; }
    public void            setGranted(Boolean v) { this.granted = v; }
    public Boolean         getSensitive()    { return sensitive; }
    public String          getDescription() { return description; }
}
