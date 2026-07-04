package com.system.UDoc.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.system.UDoc.entity.Rat;
import java.time.LocalDateTime;

public class RatDTO {

    private Long id;
    private Long trainingRoomId;
    private String trainingRoomTitle;
    private Long companyId;
    private String companyName;
    private Long ismId;
    private String ismName;
    private Long autorId;
    private String autorName;
    private Long sessaoId;
    private String status;
    private String titulo;
    private String conteudo;
    private LocalDateTime dataCriacao;

    public RatDTO() {}

    public RatDTO(Rat rat) {
        this.id = rat.getId();
        if (rat.getTrainingRoom() != null) {
            this.trainingRoomId = rat.getTrainingRoom().getId();
            this.trainingRoomTitle = rat.getTrainingRoom().getTitle();
        }
        if (rat.getCompany() != null) {
            this.companyId = rat.getCompany().getId();
            this.companyName = rat.getCompany().getName();
        }
        if (rat.getIsm() != null) {
            this.ismId = rat.getIsm().getId();
            this.ismName = rat.getIsm().getName();
        }
        if (rat.getAutor() != null) {
            this.autorId = rat.getAutor().getId();
            this.autorName = rat.getAutor().getName();
        }
        if (rat.getSessao() != null) {
            this.sessaoId = rat.getSessao().getId();
        }
        // Trata null como FINALIZADO para RATs antigos sem status
        this.status = rat.getStatus() != null ? rat.getStatus().name() : "FINALIZADO";
        this.titulo = rat.getTitulo();
        this.conteudo = rat.getConteudo();
        this.dataCriacao = rat.getDataCriacao();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTrainingRoomId() { return trainingRoomId; }
    public void setTrainingRoomId(Long trainingRoomId) { this.trainingRoomId = trainingRoomId; }
    public String getTrainingRoomTitle() { return trainingRoomTitle; }
    public void setTrainingRoomTitle(String trainingRoomTitle) { this.trainingRoomTitle = trainingRoomTitle; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public Long getIsmId() { return ismId; }
    public void setIsmId(Long ismId) { this.ismId = ismId; }
    public String getIsmName() { return ismName; }
    public void setIsmName(String ismName) { this.ismName = ismName; }
    public Long getAutorId() { return autorId; }
    public void setAutorId(Long autorId) { this.autorId = autorId; }
    public String getAutorName() { return autorName; }
    public void setAutorName(String autorName) { this.autorName = autorName; }
    public Long getSessaoId() { return sessaoId; }
    public void setSessaoId(Long sessaoId) { this.sessaoId = sessaoId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
}
