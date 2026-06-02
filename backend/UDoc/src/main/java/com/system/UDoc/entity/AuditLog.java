package com.system.UDoc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Registro de auditoria para alterações em configurações sensíveis.
 * NUNCA armazena o valor da chave — apenas quem alterou, o que e quando.
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // ex: "INTEGRATION_KEY_UPDATED", "STORAGE_LIMIT_CHANGED"

    @Column(nullable = false)
    private String target; // ex: "sendgrid_api_key", "storage_gravacoes_limite_bytes"

    @Column
    private String performedBy; // email do usuário que realizou a ação

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String details; // detalhes adicionais SEM valores sensíveis

    public AuditLog() {}

    public AuditLog(String action, String target, String performedBy, String details) {
        this.action = action;
        this.target = target;
        this.performedBy = performedBy;
        this.details = details;
    }

    public Long getId() { return id; }
    public String getAction() { return action; }
    public String getTarget() { return target; }
    public String getPerformedBy() { return performedBy; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getDetails() { return details; }
}
