package com.system.UDoc.repository;

import com.system.UDoc.entity.ChatMensagem;
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
}
