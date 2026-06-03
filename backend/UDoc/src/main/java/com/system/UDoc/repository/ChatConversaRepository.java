package com.system.UDoc.repository;

import com.system.UDoc.entity.ChatConversa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatConversaRepository extends JpaRepository<ChatConversa, Long> {

    /** Conversa aberta do cliente (há no máximo 1 aberta por vez) */
    Optional<ChatConversa> findTopByClienteIdAndStatusOrderByCriadaEmDesc(
            Long clienteId, ChatConversa.Status status);

    /** Todas as conversas abertas para um ISM específico */
    List<ChatConversa> findByIsmIdAndStatusOrderByCriadaEmDesc(
            Long ismId, ChatConversa.Status status);

    /** Admin: lista paginada de todas as conversas, filtrável por ISM e status */
    @Query(
        value = """
            SELECT * FROM chat_conversa
            WHERE (:ismId   IS NULL OR ism_id = :ismId)
              AND (:status  IS NULL OR status  = :status)
            ORDER BY criada_em DESC
        """,
        countQuery = """
            SELECT COUNT(*) FROM chat_conversa
            WHERE (:ismId   IS NULL OR ism_id = :ismId)
              AND (:status  IS NULL OR status  = :status)
        """,
        nativeQuery = true
    )
    Page<ChatConversa> searchAdmin(
            @Param("ismId")  Long   ismId,
            @Param("status") String status,
            Pageable pageable);

    /** Número de conversas abertas com mensagens não lidas do cliente para um ISM */
    @Query("""
        SELECT COUNT(DISTINCT c.id) FROM ChatConversa c
        JOIN ChatMensagem m ON m.conversa.id = c.id
        WHERE c.ism.id = :ismId
          AND c.status = 'ABERTA'
          AND m.tipo = 'CLIENTE'
          AND m.lida = false
    """)
    long countConversasComNaoLidas(@Param("ismId") Long ismId);
}
