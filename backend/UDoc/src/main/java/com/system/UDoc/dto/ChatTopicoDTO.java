package com.system.UDoc.dto;

public class ChatTopicoDTO {

    private String tema;
    private Long total;
    private String ultimaOcorrencia;

    public ChatTopicoDTO(String tema, Long total, String ultimaOcorrencia) {
        this.tema = tema;
        this.total = total;
        this.ultimaOcorrencia = ultimaOcorrencia;
    }

    public String getTema() { return tema; }
    public Long getTotal() { return total; }
    public String getUltimaOcorrencia() { return ultimaOcorrencia; }
}
