package com.system.UDoc.service;

import com.system.UDoc.dto.AIResponseDTO;
import com.system.UDoc.dto.CardSugestaoDTO;
import com.system.UDoc.dto.ChatTopicoDTO;
import com.system.UDoc.entity.ChatMensagem;
import com.system.UDoc.repository.ChatMensagemRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatAnalyticsService {

    private static final String SYSTEM_CLASSIFICATION =
        "Você é um classificador de dúvidas de suporte técnico em português brasileiro. " +
        "Analise a mensagem do cliente e retorne APENAS um tema curto (2 a 5 palavras) que descreva o assunto principal. " +
        "RESPONDA SOMENTE COM O TEMA. Sem pontuação final. Sem explicação. Sem aspas. " +
        "Exemplos: Acesso ao sistema | Problema com certificado | Dúvida sobre trilha | Erro ao fazer login";

    private static final String SYSTEM_CARD_SUGGESTION =
        "Você é especialista em criar documentação de suporte técnico em português brasileiro. " +
        "Gere o conteúdo em formato HTML usando apenas as tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <br>. " +
        "REGRA ABSOLUTA: Retorne APENAS o HTML puro, começando com <h1>. Sem explicações, sem ```html. " +
        "Crie um documento COMPLETO e DIDÁTICO com no mínimo 4 seções bem desenvolvidas. " +
        "Use <h1> para o título, <h2> para seções, <p> para parágrafos, listas para passos práticos.";

    private final ChatMensagemRepository mensagemRepo;
    private final AIService aiService;

    public ChatAnalyticsService(ChatMensagemRepository mensagemRepo, AIService aiService) {
        this.mensagemRepo = mensagemRepo;
        this.aiService = aiService;
    }

    /**
     * Classifica as próximas {@code limite} mensagens CLIENTE sem tema via IA.
     * Retorna contagem de processadas, classificadas com sucesso e pendentes restantes.
     */
    @Transactional
    public Map<String, Long> classificarMensagensNaoClassificadas(int limite) {
        int lote = Math.min(Math.max(limite, 1), 100);
        List<ChatMensagem> mensagens = mensagemRepo.findSemClassificacao(
                ChatMensagem.Tipo.CLIENTE, PageRequest.of(0, lote));

        long classificadas = 0;
        for (ChatMensagem m : mensagens) {
            try {
                AIResponseDTO resp = aiService.generate(SYSTEM_CLASSIFICATION, m.getConteudo());
                String tema = resp.content().trim()
                        .replaceAll("[.!?]+$", "")
                        .substring(0, Math.min(resp.content().trim().length(), 250));
                if (!tema.isBlank()) {
                    m.setTema(tema);
                    mensagemRepo.save(m);
                    classificadas++;
                }
            } catch (Exception ignored) {
                // falha silenciosa — não interrompe o lote nem o fluxo de chat
            }
        }

        long pendentes = mensagemRepo.countNaoClassificadas(ChatMensagem.Tipo.CLIENTE);
        return Map.of(
                "processadas", (long) mensagens.size(),
                "classificadas", classificadas,
                "pendentes", pendentes
        );
    }

    /** Retorna tópicos rankeados por recorrência, com filtro opcional de período. */
    public List<ChatTopicoDTO> getTopicosRankeados(String de, String ate) {
        // Passa null ou ISO datetime — a native query usa CAST(:de AS TIMESTAMP) para resolver tipo no PostgreSQL
        String from = (de != null && !de.isBlank()) ? de + "T00:00:00" : null;
        String to   = (ate != null && !ate.isBlank()) ? ate + "T23:59:59" : null;

        List<Object[]> rows = mensagemRepo.findTopicosRankeados(from, to);
        return rows.stream()
                .map(r -> new ChatTopicoDTO(
                        (String) r[0],
                        ((Number) r[1]).longValue(),
                        r[2] != null
                                ? ((Timestamp) r[2]).toLocalDateTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                                : null
                ))
                .collect(Collectors.toList());
    }

    /** Conta mensagens CLIENTE que ainda não foram classificadas. */
    public long contarPendentes() {
        return mensagemRepo.countNaoClassificadas(ChatMensagem.Tipo.CLIENTE);
    }

    /**
     * Gera sugestão de card de conhecimento para um tema recorrente usando IA.
     * O conteúdo retornado é HTML pronto para TipTap.
     */
    public CardSugestaoDTO gerarSugestaoCard(String tema, long total) {
        String prompt = String.format(
                "O tema '%s' apareceu %d vez(es) nas dúvidas de clientes. " +
                "Crie um card de conhecimento completo que responda esta dúvida recorrente de forma didática. " +
                "O documento deve começar com <h1>%s</h1> e conter passo a passo, dicas e exemplos práticos.",
                tema, total, tema);

        AIResponseDTO resp = aiService.generate(SYSTEM_CARD_SUGGESTION, prompt);
        return new CardSugestaoDTO(tema, resp.content(), resp.provider());
    }
}
