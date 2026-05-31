package com.system.UDoc.dto;
import jakarta.validation.constraints.*;
public class TrailContentRequestDTO {
    @NotBlank(message = "Tipo e obrigatorio") private String tipo;
    @NotNull(message = "ReferenciaId e obrigatorio") private Long referenciaId;
    @NotNull(message = "Ordem e obrigatoria") private Integer ordem;
    public TrailContentRequestDTO() {}
    public String getTipo() { return tipo; } public void setTipo(String tipo) { this.tipo = tipo; }
    public Long getReferenciaId() { return referenciaId; } public void setReferenciaId(Long referenciaId) { this.referenciaId = referenciaId; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer ordem) { this.ordem = ordem; }
}
