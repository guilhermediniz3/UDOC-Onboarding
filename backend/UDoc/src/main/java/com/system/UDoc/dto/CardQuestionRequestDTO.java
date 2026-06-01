package com.system.UDoc.dto;
import jakarta.validation.constraints.*;
import java.util.List;
public class CardQuestionRequestDTO {
    @NotBlank(message = "Enunciado is required") private String enunciado;
    @NotBlank(message = "Tipo is required") private String tipo;
    private List<String> opcoes;
    @NotBlank(message = "RespostaCorreta is required") private String respostaCorreta;
    @NotNull(message = "Pontos is required") private Double pontos;
    private Integer ordem;
    public CardQuestionRequestDTO() {}
    public String getEnunciado() { return enunciado; } public void setEnunciado(String v) { this.enunciado = v; }
    public String getTipo() { return tipo; } public void setTipo(String v) { this.tipo = v; }
    public List<String> getOpcoes() { return opcoes; } public void setOpcoes(List<String> v) { this.opcoes = v; }
    public String getRespostaCorreta() { return respostaCorreta; } public void setRespostaCorreta(String v) { this.respostaCorreta = v; }
    public Double getPontos() { return pontos; } public void setPontos(Double v) { this.pontos = v; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer v) { this.ordem = v; }
}
