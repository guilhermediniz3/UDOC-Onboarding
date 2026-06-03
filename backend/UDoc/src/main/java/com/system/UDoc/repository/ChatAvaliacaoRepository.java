package com.system.UDoc.repository;

import com.system.UDoc.entity.ChatAvaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface ChatAvaliacaoRepository extends JpaRepository<ChatAvaliacao, Long> {

    boolean existsByConversaIdAndTipo(Long conversaId, ChatAvaliacao.TipoChat tipo);

    /** Distribuição por nota para o dashboard (tipo IA ou ISM) */
    @Query(value = """
        SELECT nota, COUNT(*) AS total
        FROM chat_avaliacao
        WHERE tipo = :tipo
          AND (:startDate IS NULL OR CAST(criada_em AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate   IS NULL OR CAST(criada_em AS DATE) <= CAST(:endDate   AS DATE))
        GROUP BY nota ORDER BY nota
    """, nativeQuery = true)
    List<Map<String, Object>> distribuicaoPorNota(
            @Param("tipo") String tipo,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );
}
