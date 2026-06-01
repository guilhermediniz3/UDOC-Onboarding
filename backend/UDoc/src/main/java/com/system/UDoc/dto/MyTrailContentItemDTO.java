package com.system.UDoc.dto;

public class MyTrailContentItemDTO {
    private Integer ordem;
    private String tipo; // "card" | "sala"

    // Dados do Card
    private Long cardId;
    private String cardTitle;
    private String cardDescription;
    private String cardIcon;
    private String cardContent; // HTML completo

    // Dados da Sala (somente video)
    private Long salaId;
    private String salaTitle;
    private String vimeoUrl;
    private String youtubeUrl;

    public MyTrailContentItemDTO() {}

    public Integer getOrdem() { return ordem; } public void setOrdem(Integer o) { this.ordem = o; }
    public String getTipo() { return tipo; } public void setTipo(String t) { this.tipo = t; }
    public Long getCardId() { return cardId; } public void setCardId(Long v) { this.cardId = v; }
    public String getCardTitle() { return cardTitle; } public void setCardTitle(String v) { this.cardTitle = v; }
    public String getCardDescription() { return cardDescription; } public void setCardDescription(String v) { this.cardDescription = v; }
    public String getCardIcon() { return cardIcon; } public void setCardIcon(String v) { this.cardIcon = v; }
    public String getCardContent() { return cardContent; } public void setCardContent(String v) { this.cardContent = v; }
    public Long getSalaId() { return salaId; } public void setSalaId(Long v) { this.salaId = v; }
    public String getSalaTitle() { return salaTitle; } public void setSalaTitle(String v) { this.salaTitle = v; }
    public String getVimeoUrl() { return vimeoUrl; } public void setVimeoUrl(String v) { this.vimeoUrl = v; }
    public String getYoutubeUrl() { return youtubeUrl; } public void setYoutubeUrl(String v) { this.youtubeUrl = v; }
}
