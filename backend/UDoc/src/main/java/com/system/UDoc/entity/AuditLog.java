package com.system.UDoc.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Registro de auditoria para alterações em configurações sensíveis.
 * NUNCA armazena o valor da chave — apenas quem alterou, o que e quando.
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100)
    private String module; // ex: "CARD", "USER", "COMPANY", "TRAIL", "INTEGRATIONS"

    @Column(nullable = false)
    private String action; // ex: "CREATED", "UPDATED", "DELETED", "INTEGRATION_KEY_UPDATED"

    @Column(nullable = false)
    private String target; // ex: "card#42", "sendgrid_api_key"

    @Column
    private String performedBy; // email do usuário que realizou a ação

    // Sempre capturado em UTC (instante absoluto), independente do fuso do servidor,
    // para que cada usuário possa converter corretamente para o seu próprio horário local.
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now(ZoneOffset.UTC);

    @Column(columnDefinition = "TEXT")
    private String details; // detalhes adicionais SEM valores sensíveis

    public AuditLog() {}

    public AuditLog(String action, String target, String performedBy, String details) {
        this.action = action;
        this.target = target;
        this.performedBy = performedBy;
        this.details = details;
    }

    public AuditLog(String module, String action, String target, String performedBy, String details) {
        this.module = module;
        this.action = action;
        this.target = target;
        this.performedBy = performedBy;
        this.details = details;
    }

    public Long getId() { return id; }
    public String getModule() { return module; }
    public String getAction() { return action; }
    public String getTarget() { return target; }
    public String getPerformedBy() { return performedBy; }
    // O valor já está em UTC (ver inicialização do campo); o sufixo 'Z' literal informa
    // explicitamente isso ao cliente, que então converte para o horário local do usuário.
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getDetails() { return details; }
}
