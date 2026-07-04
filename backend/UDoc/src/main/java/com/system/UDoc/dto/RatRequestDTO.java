package com.system.UDoc.dto;

public class RatRequestDTO {

    private Long trainingRoomId;
    private Long companyId;
    private Long ismId;
    private String titulo;
    private String conteudo;

    public RatRequestDTO() {}

    public Long getTrainingRoomId() { return trainingRoomId; }
    public void setTrainingRoomId(Long trainingRoomId) { this.trainingRoomId = trainingRoomId; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getIsmId() { return ismId; }
    public void setIsmId(Long ismId) { this.ismId = ismId; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }
}
