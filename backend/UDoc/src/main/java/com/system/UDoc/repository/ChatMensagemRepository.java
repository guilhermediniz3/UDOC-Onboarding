package com.system.UDoc.repository;

import com.system.UDoc.entity.ChatMensagem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChatMensagemRepository extends JpaRepository<ChatMensagem, Long> {

    List<ChatMensagem> findByConversaIdOrderByDataHoraAsc(Long conversaId);

    @Modifying @Transactional
    @Query("UPDATE ChatMensagem m SET m.lida = true WHERE m.conversa.id = :conversaId AND m.tipo = 'CLIENTE'")
    void marcarClienteLidasPorConversa(@Param("conversaId") Long conversaId);

    @Modifying @Transactional
    @Query("UPDATE ChatMensagem m SET m.lida = true WHERE m.conversa.id = :conversaId AND m.tipo IN ('ISM', 'IA')")
    void marcarIsmLidasPorConversa(@Param("conversaId") Long conversaId);

    long countByConversaIdAndTipoAndLidaFalse(Long conversaId, ChatMensagem.Tipo tipo);

    long countByConversaIdAndTipoInAndLidaFalse(Long conversaId, java.util.List<ChatMensagem.Tipo> tipos);

    @Modifying @Transactional
    @Query("DELETE FROM ChatMensagem m WHERE m.conversa.id IN :ids")
    void deleteByConversaIdIn(@Param("ids") java.util.List<Long> ids);

    // ── Analytics ─────────────────────────────────────────────────────────────

    // Native query: CAST(:de AS TIMESTAMP) evita o erro do PostgreSQL ao inferir tipo de parâmetro null
    @Query(value =
        "SELECT cm.tema, COUNT(cm.id) AS total, MAX(cm.data_hora) AS ultima " +
        "FROM chat_mensagem cm " +
        "WHERE cm.tipo = 'CLIENTE' AND cm.tema IS NOT NULL " +
        "AND (CAST(:de AS TIMESTAMP) IS NULL OR cm.data_hora >= CAST(:de AS TIMESTAMP)) " +
        "AND (CAST(:ate AS TIMESTAMP) IS NULL OR cm.data_hora <= CAST(:ate AS TIMESTAMP)) " +
        "GROUP BY cm.tema ORDER BY total DESC",
        nativeQuery = true)
    List<Object[]> findTopicosRankeados(@Param("de") String de, @Param("ate") String ate);

    @Query("SELECT COUNT(m) FROM ChatMensagem m WHERE m.tipo = :tipo AND m.tema IS NULL")
    long countNaoClassificadas(@Param("tipo") ChatMensagem.Tipo tipo);

    @Query("SELECT m FROM ChatMensagem m WHERE m.tipo = :tipo AND m.tema IS NULL ORDER BY m.dataHora ASC")
    List<ChatMensagem> findSemClassificacao(@Param("tipo") ChatMensagem.Tipo tipo, Pageable pageable);
}
