package com.system.UDoc.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "nps_response")
public class NpsResponse {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id", nullable = false) private NpsQuestion question;
    @Column private Integer score; // 1-4 para faces, null para text
    @Column(columnDefinition = "TEXT") private String resposta;
    @Column(nullable = false, updatable = false) private LocalDateTime createdAt = LocalDateTime.now();
    public NpsResponse() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public NpsQuestion getQuestion() { return question; } public void setQuestion(NpsQuestion q) { this.question = q; }
    public Integer getScore() { return score; } public void setScore(Integer s) { this.score = s; }
    public String getResposta() { return resposta; } public void setResposta(String r) { this.resposta = r; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime c) { this.createdAt = c; }
}
