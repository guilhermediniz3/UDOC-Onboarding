package com.system.UDoc.dto;
import com.system.UDoc.entity.CardQuestion;
import java.util.ArrayList; import java.util.List;
public class CardQuestionDTO {
    private Long id; private Long cardId; private String enunciado; private String tipo;
    private List<String> opcoes; private String respostaCorreta; private Double pontos; private Integer ordem;
    public CardQuestionDTO() {}
    public CardQuestionDTO(CardQuestion q) {
        this.id = q.getId(); this.cardId = q.getCard().getId(); this.enunciado = q.getEnunciado();
        this.tipo = q.getTipo(); this.respostaCorreta = q.getRespostaCorreta(); this.pontos = q.getPontos(); this.ordem = q.getOrdem();
        if (q.getOpcoes() != null && !q.getOpcoes().isBlank()) {
            String raw = q.getOpcoes().trim();
            if (raw.startsWith("[")) raw = raw.substring(1);
            if (raw.endsWith("]")) raw = raw.substring(0, raw.length()-1);
            List<String> parsed = new ArrayList<>();
            for (String p : raw.split(",")) { String t = p.trim().replaceAll("^\"|\"$",""); if (!t.isEmpty()) parsed.add(t); }
            this.opcoes = parsed;
        }
    }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getCardId() { return cardId; } public void setCardId(Long v) { this.cardId = v; }
    public String getEnunciado() { return enunciado; } public void setEnunciado(String v) { this.enunciado = v; }
    public String getTipo() { return tipo; } public void setTipo(String v) { this.tipo = v; }
    public List<String> getOpcoes() { return opcoes; } public void setOpcoes(List<String> v) { this.opcoes = v; }
    public String getRespostaCorreta() { return respostaCorreta; } public void setRespostaCorreta(String v) { this.respostaCorreta = v; }
    public Double getPontos() { return pontos; } public void setPontos(Double v) { this.pontos = v; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer v) { this.ordem = v; }
}
