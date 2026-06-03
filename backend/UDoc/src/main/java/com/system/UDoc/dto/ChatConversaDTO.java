package com.system.UDoc.dto;

import com.system.UDoc.entity.ChatConversa;
import java.time.LocalDateTime;
import java.util.List;

public class ChatConversaDTO {
    private Long id;
    private Long clienteId;
    private String clienteNome;
    private String clienteEmail;
    private Long ismId;
    private String ismNome;
    private String ismUserEmail;    // email de login do ISM (usado para roteamento WebSocket)
    private Long ismAccountUserId;  // user_id do ISM (usado para tópico de badge)
    private String status;
    private LocalDateTime criadaEm;
    private LocalDateTime encerradaEm;
    private List<ChatMensagemDTO> mensagens;
    private long naoLidas;

    public ChatConversaDTO() {}
    public ChatConversaDTO(ChatConversa c) {
        this.id = c.getId();
        this.clienteId = c.getCliente().getId();
        this.clienteNome = c.getCliente().getName();
        this.clienteEmail = c.getCliente().getEmail();
        this.status = c.getStatus().name();
        this.criadaEm = c.getCriadaEm();
        this.encerradaEm = c.getEncerradaEm();
        if (c.getIsm() != null) {
            this.ismId = c.getIsm().getId();
            this.ismNome = c.getIsm().getName();
            if (c.getIsm().getUser() != null) {
                this.ismUserEmail    = c.getIsm().getUser().getEmail();
                this.ismAccountUserId = c.getIsm().getUser().getId();
            }
        }
    }

    public Long getId() { return id; }
    public Long getClienteId() { return clienteId; }
    public String getClienteNome() { return clienteNome; }
    public String getClienteEmail() { return clienteEmail; }
    public Long getIsmId() { return ismId; }
    public String getIsmNome() { return ismNome; }
    public String getIsmUserEmail() { return ismUserEmail; }
    public Long getIsmAccountUserId() { return ismAccountUserId; }
    public String getStatus() { return status; }
    public LocalDateTime getCriadaEm() { return criadaEm; }
    public LocalDateTime getEncerradaEm() { return encerradaEm; }
    public List<ChatMensagemDTO> getMensagens() { return mensagens; }
    public void setMensagens(List<ChatMensagemDTO> v) { this.mensagens = v; }
    public long getNaoLidas() { return naoLidas; }
    public void setNaoLidas(long v) { this.naoLidas = v; }
}
