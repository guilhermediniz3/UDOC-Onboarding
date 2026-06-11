package com.system.UDoc.repository;

import com.system.UDoc.entity.ChatMensagem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    @Query("SELECT m.tema, COUNT(m) as total, MAX(m.dataHora) as ultima " +
           "FROM ChatMensagem m " +
           "WHERE m.tipo = :tipo AND m.tema IS NOT NULL " +
           "AND (:de IS NULL OR m.dataHora >= :de) " +
           "AND (:ate IS NULL OR m.dataHora <= :ate) " +
           "GROUP BY m.tema ORDER BY total DESC")
    List<Object[]> findTopicosRankeados(@Param("tipo") ChatMensagem.Tipo tipo,
                                        @Param("de") LocalDateTime de,
                                        @Param("ate") LocalDateTime ate);

    @Query("SELECT COUNT(m) FROM ChatMensagem m WHERE m.tipo = :tipo AND m.tema IS NULL")
    long countNaoClassificadas(@Param("tipo") ChatMensagem.Tipo tipo);

    @Query("SELECT m FROM ChatMensagem m WHERE m.tipo = :tipo AND m.tema IS NULL ORDER BY m.dataHora ASC")
    List<ChatMensagem> findSemClassificacao(@Param("tipo") ChatMensagem.Tipo tipo, Pageable pageable);
}
