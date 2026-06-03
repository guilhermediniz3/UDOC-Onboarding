package com.system.UDoc.entity;
import jakarta.persistence.*;
import com.system.UDoc.entity.AuditableEntity;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity
@Table(name = "training")
public class Training extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "company_id", nullable = false) private Company company;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "trail_id", nullable = false) private Trail trail;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "training_room_id") private TrainingRoom trainingRoom;
    @Column private LocalDate dataInicio;
    @Column private LocalDate dataConclusao;
    public Training() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Company getCompany() { return company; } public void setCompany(Company company) { this.company = company; }
    public Trail getTrail() { return trail; } public void setTrail(Trail trail) { this.trail = trail; }
    public TrainingRoom getTrainingRoom() { return trainingRoom; } public void setTrainingRoom(TrainingRoom trainingRoom) { this.trainingRoom = trainingRoom; }
    public LocalDate getDataInicio() { return dataInicio; } public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }
    public LocalDate getDataConclusao() { return dataConclusao; } public void setDataConclusao(LocalDate dataConclusao) { this.dataConclusao = dataConclusao; }
}
