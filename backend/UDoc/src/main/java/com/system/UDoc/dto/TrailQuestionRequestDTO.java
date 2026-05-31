package com.system.UDoc.dto;
import jakarta.validation.constraints.*;
import java.util.List;
public class TrailQuestionRequestDTO {
    @NotBlank(message = "Enunciado e obrigatorio") private String enunciado;
    @NotBlank(message = "Tipo e obrigatorio") private String tipo;
    private List<String> opcoes;
    @NotBlank(message = "Resposta correta e obrigatoria") private String respostaCorreta;
    @NotNull(message = "Pontos e obrigatorio") private Double pontos;
    private Integer ordem;
    public TrailQuestionRequestDTO() {}
    public String getEnunciado() { return enunciado; } public void setEnunciado(String enunciado) { this.enunciado = enunciado; }
    public String getTipo() { return tipo; } public void setTipo(String tipo) { this.tipo = tipo; }
    public List<String> getOpcoes() { return opcoes; } public void setOpcoes(List<String> opcoes) { this.opcoes = opcoes; }
    public String getRespostaCorreta() { return respostaCorreta; } public void setRespostaCorreta(String respostaCorreta) { this.respostaCorreta = respostaCorreta; }
    public Double getPontos() { return pontos; } public void setPontos(Double pontos) { this.pontos = pontos; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer ordem) { this.ordem = ordem; }
}
