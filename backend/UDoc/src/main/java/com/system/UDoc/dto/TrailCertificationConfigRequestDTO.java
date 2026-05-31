package com.system.UDoc.dto;
import jakarta.validation.constraints.*;
public class TrailCertificationConfigRequestDTO {
    @NotNull(message = "Nota minima e obrigatoria") private Double notaMinima;
    public TrailCertificationConfigRequestDTO() {}
    public Double getNotaMinima() { return notaMinima; } public void setNotaMinima(Double notaMinima) { this.notaMinima = notaMinima; }
}
