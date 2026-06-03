package com.system.UDoc.repository;

import com.system.UDoc.entity.ChatAvaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface ChatAvaliacaoRepository extends JpaRepository<ChatAvaliacao, Long> {

    boolean existsByConversaIdAndTipo(Long conversaId, ChatAvaliacao.TipoChat tipo);

    /** NPS por ISM — agrupa avaliações tipo=ISM por ism_id, com nome e foto do ISM */
    @Query(value = """
        SELECT
          i.id          AS ismId,
          i.name        AS ismNome,
          i.photo       AS ismFoto,
          SUM(CASE WHEN ca.nota = 1 THEN 1 ELSE 0 END) AS nota1,
          SUM(CASE WHEN ca.nota = 2 THEN 1 ELSE 0 END) AS nota2,
          SUM(CASE WHEN ca.nota = 3 THEN 1 ELSE 0 END) AS nota3,
          SUM(CASE WHEN ca.nota = 4 THEN 1 ELSE 0 END) AS nota4,
          COUNT(ca.id)  AS total
        FROM chat_avaliacao ca
        JOIN chat_conversa cc ON ca.conversa_id = cc.id
        JOIN ism i            ON cc.ism_id       = i.id
        WHERE ca.tipo = 'ISM'
          AND (:ismId     IS NULL OR i.id = :ismId)
          AND (:startDate IS NULL OR CAST(ca.criada_em AS DATE) >= CAST(:startDate AS DATE))
          AND (:endDate   IS NULL OR CAST(ca.criada_em AS DATE) <= CAST(:endDate   AS DATE))
        GROUP BY i.id, i.name, i.photo
        ORDER BY i.name
    """, nativeQuery = true)
    java.util.List<java.util.Map<String, Object>> npsAgrupadoPorIsm(
            @Param("ismId")     Long   ismId,
            @Param("startDate") String startDate,
            @Param("endDate")   String endDate);

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
