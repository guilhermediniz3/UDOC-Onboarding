package com.system.UDoc.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "training_employee_result")
public class TrainingEmployee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "training_id", nullable = false) private Training training;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "employee_id", nullable = false) private Employee employee;
    @Column private Double notaObtida;
    @Column(nullable = false) private Boolean aprovado = false;
    public TrainingEmployee() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Training getTraining() { return training; } public void setTraining(Training training) { this.training = training; }
    public Employee getEmployee() { return employee; } public void setEmployee(Employee employee) { this.employee = employee; }
    public Double getNotaObtida() { return notaObtida; } public void setNotaObtida(Double notaObtida) { this.notaObtida = notaObtida; }
    public Boolean getAprovado() { return aprovado; } public void setAprovado(Boolean aprovado) { this.aprovado = aprovado; }
}
