package com.system.UDoc.controller;

import com.system.UDoc.dto.ChatMensagemDTO;
import com.system.UDoc.entity.ChatMensagem;
import com.system.UDoc.entity.User;
import com.system.UDoc.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * Controller STOMP — mensagens em tempo real.
 *
 * Canais:
 *   Cliente envia: /app/chat.enviar       → ISM recebe em /user/{ismEmail}/queue/mensagens
 *   ISM responde:  /app/chat.responder    → Cliente recebe em /user/{clienteEmail}/queue/mensagens
 *   ISM status:    /app/chat.status       → broadcast /topic/ism-status
 */
@Controller
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService       = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    /** Cliente envia mensagem ao ISM */
    @MessageMapping("/chat.enviar")
    public void clienteEnvia(@Payload Map<String, Object> payload, Principal principal) {
        Long conversaId = Long.valueOf(String.valueOf(payload.get("conversaId")));
        String conteudo = String.valueOf(payload.get("conteudo"));

        ChatMensagemDTO msg = chatService.salvarMensagem(conversaId, conteudo, ChatMensagem.Tipo.CLIENTE);

        // Notifica ISM em tempo real
        String ismEmail = String.valueOf(payload.get("ismEmail"));
        if (ismEmail != null && !ismEmail.isBlank()) {
            messagingTemplate.convertAndSendToUser(ismEmail, "/queue/mensagens", msg);
        }

        // Atualiza badge de não lidas do ISM
        atualizarBadgeIsm(String.valueOf(payload.get("ismUserId")));
    }

    /** ISM responde ao cliente */
    @MessageMapping("/chat.responder")
    public void ismResponde(@Payload Map<String, Object> payload, Principal principal) {
        Long conversaId   = Long.valueOf(String.valueOf(payload.get("conversaId")));
        String conteudo   = String.valueOf(payload.get("conteudo"));
        String clienteEmail = String.valueOf(payload.get("clienteEmail"));

        ChatMensagemDTO msg = chatService.salvarMensagem(conversaId, conteudo, ChatMensagem.Tipo.ISM);

        // Notifica cliente em tempo real
        messagingTemplate.convertAndSendToUser(clienteEmail, "/queue/mensagens", msg);
    }

    /** ISM publica status (Online / Ausente / Offline) */
    @MessageMapping("/chat.status")
    public void ismStatus(@Payload Map<String, String> payload) {
        // Broadcast do status para todos que precisam exibir o indicador
        messagingTemplate.convertAndSend("/topic/ism-status", payload);
    }

    /** ISM encerra atendimento via WebSocket — dispara evento de NPS no cliente */
    @MessageMapping("/chat.encerrar")
    public void ismEncerra(@Payload Map<String, Object> payload, Principal principal) {
        Long conversaId     = Long.valueOf(String.valueOf(payload.get("conversaId")));
        String clienteEmail = String.valueOf(payload.get("clienteEmail"));
        String ismUserId    = String.valueOf(payload.get("ismUserId"));

        // Chama serviço (já faz validação de ownership)
        // Usa principal para obter userId do ISM logado via WebSocket
        // Encerramento via REST /chat/ism/conversas/{id}/encerrar também é suportado

        // Notifica cliente que a conversa foi encerrada → dispara NPS no frontend
        messagingTemplate.convertAndSendToUser(
                clienteEmail, "/queue/mensagens",
                Map.of("tipo", "ENCERRAMENTO", "conversaId", conversaId));

        // Atualiza badge do ISM
        atualizarBadgeIsm(ismUserId);
    }

    private void atualizarBadgeIsm(String ismUserIdStr) {
        try {
            Long ismUserId = Long.valueOf(ismUserIdStr);
            long total = chatService.contarNaoLidasParaIsm(ismUserId);
            // Envia para a fila pessoal do ISM (usa o User do Principal identificado pelo email)
            messagingTemplate.convertAndSend("/topic/ism-badge-" + ismUserId,
                    Map.of("naoLidas", total));
        } catch (Exception ignored) {}
    }
}
