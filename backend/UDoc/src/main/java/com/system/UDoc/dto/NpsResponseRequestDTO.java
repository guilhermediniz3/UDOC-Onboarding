package com.system.UDoc.dto;
public class NpsResponseRequestDTO {
    private Long questionId; private Integer score; private String resposta;
    public NpsResponseRequestDTO() {}
    public Long getQuestionId() { return questionId; } public void setQuestionId(Long q) { this.questionId = q; }
    public Integer getScore() { return score; } public void setScore(Integer s) { this.score = s; }
    public String getResposta() { return resposta; } public void setResposta(String r) { this.resposta = r; }
}
