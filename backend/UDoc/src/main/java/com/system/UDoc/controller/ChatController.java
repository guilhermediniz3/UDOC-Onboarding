package com.system.UDoc.controller;

import com.system.UDoc.dto.ChatConversaDTO;
import com.system.UDoc.entity.ChatAvaliacao;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.EmployeeRepository;
import com.system.UDoc.service.ChatIAService;
import com.system.UDoc.service.ChatService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private final ChatService chatService;
    private final ChatIAService chatIAService;
    private final EmployeeRepository employeeRepository;

    public ChatController(ChatService chatService, ChatIAService chatIAService,
                          EmployeeRepository employeeRepository) {
        this.chatService        = chatService;
        this.chatIAService      = chatIAService;
        this.employeeRepository = employeeRepository;
    }

    // ── Configuração global ───────────────────────────────────────────────────

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig(@AuthenticationPrincipal User user) {
        boolean globalOn = chatService.isChatGlobalHabilitado();
        boolean ismOn = true; // ISM e ADMIN têm acesso total

        if (user != null && "FUNCIONARIO_EXTERNO".equals(user.getRole().name())) {
            ismOn = employeeRepository.findByUserId(user.getId())
                    .map(emp -> {
                        // Funcionário Interno não precisa de atendimento ISM (é da equipe interna)
                        if ("INTERNO".equals(emp.getTipo())) return false;
                        return emp.getChatIsmHabilitado();
                    })
                    .orElse(true);
        }

        return ResponseEntity.ok(Map.of(
            "chatGlobalHabilitado", globalOn,
            "chatIsmHabilitado", ismOn
        ));
    }

    // ── IA ────────────────────────────────────────────────────────────────────

    @GetMapping("/ia/boas-vindas")
    public ResponseEntity<Map<String, String>> boasVindas() {
        return ResponseEntity.ok(Map.of("mensagem", chatIAService.boasVindas()));
    }

    @PostMapping("/ia/perguntar")
    public ResponseEntity<Map<String, String>> perguntar(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user
    ) {
        String pergunta = body.getOrDefault("pergunta", "");
        if (pergunta.isBlank()) return ResponseEntity.badRequest().build();

        // Mesma regra de visibilidade do catálogo: cards internos ficam ocultos apenas
        // para funcionários externos — ADMIN, ISM e funcionário interno enxergam tudo.
        boolean hideInterno = user != null && "FUNCIONARIO_EXTERNO".equals(user.getRole().name());

        return ResponseEntity.ok(Map.of("resposta", chatIAService.responder(pergunta, hideInterno)));
    }

    // ── Conversa (cliente) ────────────────────────────────────────────────────

    @GetMapping("/conversa")
    public ResponseEntity<ChatConversaDTO> minhaConversa(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.obterOuCriarConversa(user.getId()));
    }

    @PostMapping("/conversa/{id}/mensagem")
    public ResponseEntity<Void> enviarMensagem(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String conteudo = body.getOrDefault("conteudo", "").trim();
        if (conteudo.isBlank()) return ResponseEntity.badRequest().build();
        chatService.salvarMensagemCliente(id, conteudo);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/conversa/{id}/avaliar")
    public ResponseEntity<Void> avaliar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        int nota = Integer.parseInt(String.valueOf(body.get("nota")));
        String tipo = String.valueOf(body.get("tipo")); // IA | ISM
        chatService.salvarAvaliacao(id, nota, ChatAvaliacao.TipoChat.valueOf(tipo));
        return ResponseEntity.noContent().build();
    }

    // ── Não lidas para o cliente (mensagens do ISM/IA) ───────────────────────

    @GetMapping("/conversa/nao-lidas")
    public ResponseEntity<Map<String, Long>> naoLidasCliente(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("total", chatService.contarNaoLidasParaCliente(user.getId())));
    }

    @PostMapping("/conversa/marcar-lidas")
    public ResponseEntity<Void> marcarLidasCliente(@AuthenticationPrincipal User user) {
        chatService.marcarIsmLidasParaCliente(user.getId());
        return ResponseEntity.noContent().build();
    }

    // ── Fila do ISM ───────────────────────────────────────────────────────────

    @GetMapping("/ism/conversas")
    public ResponseEntity<List<ChatConversaDTO>> conversasDoIsm(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(chatService.listarConversasDoIsm(user.getId()));
        } catch (Exception e) {
            // ISM entity não vinculada ao User — retorna lista vazia em vez de 404
            return ResponseEntity.ok(java.util.List.of());
        }
    }

    /** Indica se o usuário ISM logado tem seu perfil ISM vinculado (necessário para o chat) */
    @GetMapping("/ism/vinculado")
    public ResponseEntity<Map<String, Boolean>> ismVinculado(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("vinculado", chatService.ismEstaVinculado(user.getId())));
    }

    @PostMapping("/ism/conversas/{id}/mensagem")
    public ResponseEntity<Void> ismEnviaMensagem(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String conteudo = body.getOrDefault("conteudo", "").trim();
        if (conteudo.isBlank()) return ResponseEntity.badRequest().build();
        chatService.salvarMensagemIsm(id, conteudo, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ism/conversas/{id}")
    public ResponseEntity<ChatConversaDTO> detalharConversa(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.detalharConversa(id, user.getId()));
    }

    @PostMapping("/ism/conversas/{id}/encerrar")
    public ResponseEntity<Void> encerrar(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        chatService.encerrarConversa(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ism/nao-lidas")
    public ResponseEntity<Map<String, Long>> naoLidas(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("total", chatService.contarNaoLidasParaIsm(user.getId())));
    }

    // ── Admin: monitoramento ──────────────────────────────────────────────────

    @GetMapping("/admin/conversas")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Page<ChatConversaDTO>> adminListarConversas(
            @RequestParam(required = false) Long ismId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(chatService.listarConversasAdmin(
                ismId, status,
                PageRequest.of(page, size, Sort.by("criadaEm").descending())));
    }

    @GetMapping("/admin/conversas/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ChatConversaDTO> adminDetalharConversa(@PathVariable Long id) {
        return ResponseEntity.ok(chatService.detalharConversaAdmin(id));
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(Map.of(
            "avaliacoes", chatService.getDashboard(startDate, endDate)
        ));
    }
}
