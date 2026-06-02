package com.system.UDoc.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "global_config")
public class GlobalConfig {

    @Id
    private String chave;

    @Column(columnDefinition = "TEXT")
    private String valor;

    public GlobalConfig() {}
    public GlobalConfig(String chave, String valor) { this.chave = chave; this.valor = valor; }

    public String getChave() { return chave; } public void setChave(String c) { this.chave = c; }
    public String getValor() { return valor; } public void setValor(String v) { this.valor = v; }
}
