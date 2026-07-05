package com.system.UDoc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "sessao_treinamento")
public class SessaoTreinamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_room_id", nullable = false)
    private TrainingRoom trainingRoom;

    @Column(nullable = false)
    private LocalDateTime dataHoraInicio;

    @Column
    private LocalDateTime dataHoraFim;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessaoTreinamentoStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_id", nullable = false)
    private User criadoPor;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private ModoCaptura modoCaptura;

    public SessaoTreinamento() {}

    @PrePersist
    private void prePersist() {
        if (dataHoraInicio == null) {
            dataHoraInicio = LocalDateTime.now(ZoneOffset.UTC);
        }
        if (status == null) {
            status = SessaoTreinamentoStatus.EM_ANDAMENTO;
        }
        if (modoCaptura == null) {
            modoCaptura = ModoCaptura.SOLO;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TrainingRoom getTrainingRoom() { return trainingRoom; }
    public void setTrainingRoom(TrainingRoom trainingRoom) { this.trainingRoom = trainingRoom; }
    public LocalDateTime getDataHoraInicio() { return dataHoraInicio; }
    public void setDataHoraInicio(LocalDateTime dataHoraInicio) { this.dataHoraInicio = dataHoraInicio; }
    public LocalDateTime getDataHoraFim() { return dataHoraFim; }
    public void setDataHoraFim(LocalDateTime dataHoraFim) { this.dataHoraFim = dataHoraFim; }
    public SessaoTreinamentoStatus getStatus() { return status; }
    public void setStatus(SessaoTreinamentoStatus status) { this.status = status; }
    public User getCriadoPor() { return criadoPor; }
    public void setCriadoPor(User criadoPor) { this.criadoPor = criadoPor; }
    public ModoCaptura getModoCaptura() { return modoCaptura; }
    public void setModoCaptura(ModoCaptura modoCaptura) { this.modoCaptura = modoCaptura; }
}
