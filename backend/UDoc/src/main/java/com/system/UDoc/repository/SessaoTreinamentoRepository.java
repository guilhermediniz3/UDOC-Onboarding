package com.system.UDoc.repository;

import com.system.UDoc.entity.SessaoTreinamento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SessaoTreinamentoRepository extends JpaRepository<SessaoTreinamento, Long> {
    List<SessaoTreinamento> findByTrainingRoomIdOrderByDataHoraInicioDesc(Long trainingRoomId);
}
