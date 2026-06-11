package com.system.UDoc.dto;

public class CardSugestaoDTO {

    private String tema;
    private String conteudoHtml;
    private String provedor;

    public CardSugestaoDTO(String tema, String conteudoHtml, String provedor) {
        this.tema = tema;
        this.conteudoHtml = conteudoHtml;
        this.provedor = provedor;
    }

    public String getTema() { return tema; }
    public String getConteudoHtml() { return conteudoHtml; }
    public String getProvedor() { return provedor; }
}
