package com.system.UDoc.dto;
import com.system.UDoc.entity.NpsQuestion;
public class NpsQuestionDTO {
    private Long id; private String referenceType; private Long referenceId;
    private String enunciado; private String tipo; private Integer ordem;
    public NpsQuestionDTO() {}
    public NpsQuestionDTO(NpsQuestion q) {
        this.id = q.getId(); this.referenceType = q.getReferenceType(); this.referenceId = q.getReferenceId();
        this.enunciado = q.getEnunciado(); this.tipo = q.getTipo(); this.ordem = q.getOrdem();
    }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getReferenceType() { return referenceType; } public void setReferenceType(String r) { this.referenceType = r; }
    public Long getReferenceId() { return referenceId; } public void setReferenceId(Long r) { this.referenceId = r; }
    public String getEnunciado() { return enunciado; } public void setEnunciado(String e) { this.enunciado = e; }
    public String getTipo() { return tipo; } public void setTipo(String t) { this.tipo = t; }
    public Integer getOrdem() { return ordem; } public void setOrdem(Integer o) { this.ordem = o; }
}
