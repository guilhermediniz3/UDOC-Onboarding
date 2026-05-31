package com.system.UDoc.dto;
import com.system.UDoc.entity.TrailQuestion;
import java.util.List;
import java.util.ArrayList;
public class TrailQuestionDTO {
    private Long id; private Long trailId; private String enunciado; private String tipo;
    private List<String> opcoes; private String respostaCorreta; private Double pontos; private Integer ordem;
    public TrailQuestionDTO() {}
    public TrailQuestionDTO(TrailQuestion q) {
        this.id = q.getId(); this.trailId = q.getTrail().getId(); this.enunciado = q.getEnunciado();
        this.tipo = q.getTipo(); this.respostaCorreta = q.getRespostaCorreta(); this.pontos = q.getPontos(); this.ordem = q.getOrdem();
        if (q.getOpcoes() != null && !q.getOpcoes().isBlank()) {
            String raw = q.getOpcoes().trim();
            if (raw.startsWith("[")) raw = raw.substring(1);
            if (raw.endsWith("]")) raw = raw.substring(0, raw.length() - 1);
            List<String> parsed = new ArrayList<>();
            for (String part : raw.split(",")) {
                String trimmed = part.trim().replaceAll("^\"|\"$", "");
                if (!trimmed.isEmpty()) parsed.add(trimmed);
            }
            this.opcoes = parsed;
        }
    }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getTrailId() { return trailId; } public void setTrailId(Long trailId) { this.trailId = trailId; }
    public String getEnunciado() { return enunciado; } public void setEnunciado(String enunciado) { this.enunciado = enunciado; }
    public String getTipo() { return tipo; } public void setTipo(String tipo) { this.tipo = tipo; }
    public List<String> getOpcoes() { return opcoes; } public void setOpcoes(List<String> opcoes) { this.opcoes = opcoes; }
    public String getRespostaCorreta() { return respostaCorreta; } public void setRespostaCorreta(String respostaCorreta) { this.respostaCorreta = respostaCorreta; }
    public Double getPontos() { return pontos; } public void setPontos(Double pontos) { this.pontos = pontos; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer ordem) { this.ordem = ordem; }
}
