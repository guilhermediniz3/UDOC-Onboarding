package com.system.UDoc.dto;

import java.util.List;
import java.util.Map;

public class NpsDashboardDTO {
    private Long totalCardAccesses;
    private Long totalRespostas;
    private Double avgNpsScore;
    private List<Map<String, Object>> topCards;
    private List<Map<String, Object>> npsTimeline;
    private List<Map<String, Object>> satisfactionDistribution;

    public NpsDashboardDTO() {}

    public Long getTotalCardAccesses() { return totalCardAccesses; }
    public void setTotalCardAccesses(Long v) { this.totalCardAccesses = v; }
    public Long getTotalRespostas() { return totalRespostas; }
    public void setTotalRespostas(Long v) { this.totalRespostas = v; }
    public Double getAvgNpsScore() { return avgNpsScore; }
    public void setAvgNpsScore(Double v) { this.avgNpsScore = v; }
    public List<Map<String, Object>> getTopCards() { return topCards; }
    public void setTopCards(List<Map<String, Object>> v) { this.topCards = v; }
    public List<Map<String, Object>> getNpsTimeline() { return npsTimeline; }
    public void setNpsTimeline(List<Map<String, Object>> v) { this.npsTimeline = v; }
    public List<Map<String, Object>> getSatisfactionDistribution() { return satisfactionDistribution; }
    public void setSatisfactionDistribution(List<Map<String, Object>> v) { this.satisfactionDistribution = v; }
}
