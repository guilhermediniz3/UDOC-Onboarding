package com.system.UDoc.service;

import com.system.UDoc.dto.ChatConversaDTO;
import com.system.UDoc.dto.ChatMensagemDTO;
import com.system.UDoc.entity.*;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    private final ChatConversaRepository conversaRepo;
    private final ChatMensagemRepository mensagemRepo;
    private final ChatAvaliacaoRepository avaliacaoRepo;
    private final UserRepository userRepo;
    private final IsmRepository ismRepo;
    private final EmployeeRepository employeeRepo;
    private final GlobalConfigService globalConfig;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ChatConversaRepository conversaRepo,
                       ChatMensagemRepository mensagemRepo,
                       ChatAvaliacaoRepository avaliacaoRepo,
                       UserRepository userRepo,
                       IsmRepository ismRepo,
                       EmployeeRepository employeeRepo,
                       GlobalConfigService globalConfig,
                       SimpMessagingTemplate messagingTemplate) {
        this.conversaRepo      = conversaRepo;
        this.mensagemRepo      = mensagemRepo;
        this.avaliacaoRepo     = avaliacaoRepo;
        this.userRepo          = userRepo;
        this.ismRepo           = ismRepo;
        this.employeeRepo      = employeeRepo;
        this.globalConfig      = globalConfig;
        this.messagingTemplate = messagingTemplate;
    }

    // ── Configuração global ───────────────────────────────────────────────────

    public boolean isChatGlobalHabilitado() {
        String v = globalConfig.getStringValue("chat_habilitado");
        return v == null || !"false".equalsIgnoreCase(v);
    }

    // ── Conversa ─────────────────────────────────────────────────────────────

    /** Retorna conversa aberta do cliente ou cria uma nova */
    @Transactional
    public ChatConversaDTO obterOuCriarConversa(Long clienteUserId) {
        if (!isChatGlobalHabilitado())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chat desabilitado");

        User cliente = userRepo.findById(clienteUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ChatConversa conversa = conversaRepo
                .findTopByClienteIdAndStatusOrderByCriadaEmDesc(clienteUserId, ChatConversa.Status.ABERTA)
                .orElseGet(() -> {
                    ChatConversa nova = new ChatConversa();
                    nova.setCliente(cliente);
                    return conversaRepo.save(nova);
                });

        // Sincroniza ISM sempre (cobre conversas criadas antes do ISM ser vinculado ao funcionário)
        if (conversa.getIsm() == null) {
            employeeRepo.findByUserId(clienteUserId).ifPresent(emp -> {
                if (emp.getIsm() != null) {
                    conversa.setIsm(emp.getIsm());
                    conversaRepo.save(conversa);
                }
            });
        }

        ChatConversaDTO dto = new ChatConversaDTO(conversa);
        dto.setMensagens(mensagemRepo.findByConversaIdOrderByDataHoraAsc(conversa.getId())
                .stream().map(ChatMensagemDTO::new).toList());
        return dto;
    }

    /** Lista conversas abertas para o ISM logado */
    @Transactional(readOnly = true)
    public List<ChatConversaDTO> listarConversasDoIsm(Long ismUserId) {
        Ism ism = findIsmByUserId(ismUserId);
        return conversaRepo.findByIsmIdAndStatusOrderByCriadaEmDesc(ism.getId(), ChatConversa.Status.ABERTA)
                .stream().map(c -> {
                    ChatConversaDTO dto = new ChatConversaDTO(c);
                    long naoLidas = mensagemRepo.countByConversaIdAndTipoAndLidaFalse(c.getId(), ChatMensagem.Tipo.CLIENTE);
                    dto.setNaoLidas(naoLidas);
                    return dto;
                }).toList();
    }

    /** Detalhes de uma conversa com mensagens */
    @Transactional
    public ChatConversaDTO detalharConversa(Long conversaId, Long ismUserId) {
        ChatConversa conversa = conversaRepo.findById(conversaId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada"));
        // ISM só vê suas conversas
        Ism ism = findIsmByUserId(ismUserId);
        if (conversa.getIsm() == null || !conversa.getIsm().getId().equals(ism.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado");
        // Marca mensagens do cliente como lidas
        mensagemRepo.marcarClienteLidasPorConversa(conversaId);
        ChatConversaDTO dto = new ChatConversaDTO(conversa);
        dto.setMensagens(mensagemRepo.findByConversaIdOrderByDataHoraAsc(conversaId)
                .stream().map(ChatMensagemDTO::new).toList());
        return dto;
    }

    // ── Mensagens ─────────────────────────────────────────────────────────────

    /** Persiste resposta do ISM via REST e notifica cliente via WebSocket */
    @Transactional
    public void salvarMensagemIsm(Long conversaId, String conteudo, Long ismUserId) {
        ChatConversa conversa = conversaRepo.findById(conversaId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada"));
        // Valida que o ISM logado é o responsável pela conversa
        Ism ism = findIsmByUserId(ismUserId);
        if (conversa.getIsm() == null || !conversa.getIsm().getId().equals(ism.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado");

        ChatMensagemDTO msg = salvarMensagem(conversaId, conteudo, ChatMensagem.Tipo.ISM);

        // Notifica cliente em tempo real
        String clienteEmail = conversa.getCliente().getEmail();
        messagingTemplate.convertAndSendToUser(clienteEmail, "/queue/mensagens", msg);
    }

    /** Persiste mensagem do cliente via REST e notifica ISM via WebSocket se vinculado */
    @Transactional
    public void salvarMensagemCliente(Long conversaId, String conteudo) {
        ChatMensagemDTO msg = salvarMensagem(conversaId, conteudo, ChatMensagem.Tipo.CLIENTE);

        ChatConversa conversa = conversaRepo.findById(conversaId).orElse(null);
        if (conversa == null) return;

        // Notifica ISM em tempo real (somente se vinculado e com conta de usuário)
        if (conversa.getIsm() != null && conversa.getIsm().getUser() != null) {
            String ismEmail  = conversa.getIsm().getUser().getEmail();
            Long   ismUserId = conversa.getIsm().getUser().getId();
            messagingTemplate.convertAndSendToUser(ismEmail, "/queue/mensagens", msg);
            long total = contarNaoLidasParaIsm(ismUserId);
            messagingTemplate.convertAndSend("/topic/ism-badge-" + ismUserId, Map.of("naoLidas", total));
        }
    }

    @Transactional
    public ChatMensagemDTO salvarMensagem(Long conversaId, String conteudo, ChatMensagem.Tipo tipo) {
        ChatConversa conversa = conversaRepo.findById(conversaId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada"));
        ChatMensagem msg = new ChatMensagem();
        msg.setConversa(conversa);
        msg.setConteudo(conteudo);
        msg.setTipo(tipo);
        return new ChatMensagemDTO(mensagemRepo.save(msg));
    }

    // ── Contagem não lidas (para badge do ISM) ────────────────────────────────

    public long contarNaoLidasParaIsm(Long ismUserId) {
        try {
            Ism ism = findIsmByUserId(ismUserId);
            return conversaRepo.countConversasComNaoLidas(ism.getId());
        } catch (Exception e) {
            return 0L;
        }
    }

    // ── Encerrar conversa ─────────────────────────────────────────────────────

    @Transactional
    public void encerrarConversa(Long conversaId, Long ismUserId) {
        ChatConversa conversa = conversaRepo.findById(conversaId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada"));
        Ism ism = findIsmByUserId(ismUserId);
        if (conversa.getIsm() == null || !conversa.getIsm().getId().equals(ism.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado");
        String clienteEmail = conversa.getCliente().getEmail();
        conversa.setStatus(ChatConversa.Status.ENCERRADA);
        conversa.setEncerradaEm(LocalDateTime.now());
        conversaRepo.save(conversa);

        // Notifica o cliente via WebSocket para disparar o NPS
        messagingTemplate.convertAndSendToUser(
                clienteEmail, "/queue/mensagens",
                java.util.Map.of("tipo", "ENCERRAMENTO", "conversaId", conversa.getId()));
    }

    // ── Avaliação ─────────────────────────────────────────────────────────────

    @Transactional
    public void salvarAvaliacao(Long conversaId, int nota, ChatAvaliacao.TipoChat tipo) {
        if (nota < 1 || nota > 4)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nota deve ser entre 1 e 4");
        if (avaliacaoRepo.existsByConversaIdAndTipo(conversaId, tipo))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Avaliação já registrada");
        ChatConversa conversa = conversaRepo.findById(conversaId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada"));
        ChatAvaliacao av = new ChatAvaliacao();
        av.setConversa(conversa);
        av.setNota(nota);
        av.setTipo(tipo);
        avaliacaoRepo.save(av);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public Map<String, List<Map<String, Object>>> getDashboard(String startDate, String endDate) {
        return Map.of(
            "ia",  avaliacaoRepo.distribuicaoPorNota("IA",  startDate, endDate),
            "ism", avaliacaoRepo.distribuicaoPorNota("ISM", startDate, endDate)
        );
    }

    // ── Não lidas para o CLIENTE (mensagens do ISM/IA ainda não vistas) ──────

    public long contarNaoLidasParaCliente(Long clienteUserId) {
        return conversaRepo
                .findTopByClienteIdAndStatusOrderByCriadaEmDesc(clienteUserId, ChatConversa.Status.ABERTA)
                .map(c -> mensagemRepo.countByConversaIdAndTipoInAndLidaFalse(
                        c.getId(),
                        java.util.List.of(ChatMensagem.Tipo.ISM, ChatMensagem.Tipo.IA)))
                .orElse(0L);
    }

    @Transactional
    public void marcarIsmLidasParaCliente(Long clienteUserId) {
        conversaRepo.findTopByClienteIdAndStatusOrderByCriadaEmDesc(clienteUserId, ChatConversa.Status.ABERTA)
                .ifPresent(c -> mensagemRepo.marcarIsmLidasPorConversa(c.getId()));
    }

    public boolean ismEstaVinculado(Long userId) {
        try { findIsmByUserId(userId); return true; }
        catch (Exception e) { return false; }
    }

    // ── Helper: resolve ISM pelo userId, com fallback por email ──────────────
    // Cobre o caso em que o ISM foi criado sem user_id vinculado (vínculo ausente
    // no cadastro) — tenta casar pelo email do User e auto-linka user_id para
    // que as próximas chamadas já usem o caminho rápido.
    private Ism findIsmByUserId(Long userId) {
        return ismRepo.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepo.findById(userId).orElse(null);
                    if (user == null)
                        throw new ResourceNotFoundException("ISM not found for user " + userId);
                    Ism ism = ismRepo.findByEmailIgnoreCase(user.getEmail())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "ISM não encontrado para o usuário " + user.getEmail() +
                                    ". Verifique se o e-mail do cadastro ISM coincide com o e-mail da conta."));
                    // Auto-vincula user_id para evitar fallback nas próximas chamadas
                    ism.setUser(user);
                    return ismRepo.save(ism);
                });
    }

    // ── Admin: monitoramento ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ChatConversaDTO> listarConversasAdmin(Long ismId, String status, Pageable pageable) {
        return conversaRepo.searchAdmin(ismId, status, pageable).map(c -> {
            ChatConversaDTO dto = new ChatConversaDTO(c);
            long naoLidas = mensagemRepo.countByConversaIdAndTipoAndLidaFalse(c.getId(), ChatMensagem.Tipo.CLIENTE);
            dto.setNaoLidas(naoLidas);
            return dto;
        });
    }

    @Transactional(readOnly = true)
    public ChatConversaDTO detalharConversaAdmin(Long conversaId) {
        ChatConversa conversa = conversaRepo.findById(conversaId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversa não encontrada"));
        ChatConversaDTO dto = new ChatConversaDTO(conversa);
        dto.setMensagens(mensagemRepo.findByConversaIdOrderByDataHoraAsc(conversaId)
                .stream().map(ChatMensagemDTO::new).toList());
        return dto;
    }
}
