package com.system.UDoc.dto;

import com.system.UDoc.entity.ChatMensagem;
import java.time.LocalDateTime;

public class ChatMensagemDTO {
    private Long id;
    private Long conversaId;
    private String conteudo;
    private String tipo;
    private Boolean lida;
    private LocalDateTime dataHora;

    public ChatMensagemDTO() {}
    public ChatMensagemDTO(ChatMensagem m) {
        this.id = m.getId();
        this.conversaId = m.getConversa().getId();
        this.conteudo = m.getConteudo();
        this.tipo = m.getTipo().name();
        this.lida = m.getLida();
        this.dataHora = m.getDataHora();
    }

    public Long getId() { return id; }
    public Long getConversaId() { return conversaId; }
    public String getConteudo() { return conteudo; }
    public String getTipo() { return tipo; }
    public Boolean getLida() { return lida; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setId(Long v) { this.id = v; }
    public void setConversaId(Long v) { this.conversaId = v; }
    public void setConteudo(String v) { this.conteudo = v; }
    public void setTipo(String v) { this.tipo = v; }
    public void setLida(Boolean v) { this.lida = v; }
    public void setDataHora(LocalDateTime v) { this.dataHora = v; }
}
