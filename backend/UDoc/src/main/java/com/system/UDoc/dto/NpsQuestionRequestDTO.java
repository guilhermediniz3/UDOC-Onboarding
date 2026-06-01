package com.system.UDoc.dto;
import jakarta.validation.constraints.*;
public class NpsQuestionRequestDTO {
    @NotBlank(message = "Enunciado is required") private String enunciado;
    @NotBlank(message = "Tipo is required") private String tipo;
    private Integer ordem;
    public NpsQuestionRequestDTO() {}
    public String getEnunciado() { return enunciado; } public void setEnunciado(String e) { this.enunciado = e; }
    public String getTipo() { return tipo; } public void setTipo(String t) { this.tipo = t; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer o) { this.ordem = o; }
}
