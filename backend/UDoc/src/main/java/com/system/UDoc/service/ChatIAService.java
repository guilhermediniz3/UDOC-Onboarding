package com.system.UDoc.service;

import com.system.UDoc.exception.AIQuotaExceededException;
import com.system.UDoc.repository.CardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatIAService {

    private static final Logger log = LoggerFactory.getLogger(ChatIAService.class);

    private final CardRepository cardRepository;
    private final AIService aiService;

    public ChatIAService(CardRepository cardRepository, AIService aiService) {
        this.cardRepository = cardRepository;
        this.aiService      = aiService;
    }

    private static final String SYSTEM_INSTRUCTION = """
        Você é o assistente virtual de onboarding do UDoc. Responda sempre em português do Brasil,
        de forma objetiva, didática e cordial.
        REGRAS OBRIGATÓRIAS:
        - Responda SOMENTE com texto puro. PROIBIDO usar HTML, markdown, tags, asteriscos ou qualquer formatação.
        - Use APENAS as informações dos documentos fornecidos pelo usuário. Não invente nada e não mencione documentos que não foram fornecidos.
        - Se os documentos fornecidos não contiverem a resposta, escreva apenas: "Não encontrei informações sobre esse assunto nos documentos disponíveis."
        """;

    /** Palavras sem valor de busca — ignoradas ao extrair palavras-chave da pergunta. */
    private static final Set<String> STOP_WORDS = Set.of(
            "a","o","as","os","de","da","do","das","dos","e","ou","que","com","para","por",
            "em","um","uma","uns","umas","no","na","nos","nas","se","sua","seu","suas","seus",
            "como","qual","quais","quando","onde","quem","porque","é","sao","são",
            "ao","aos","à","às","mais","menos","muito","pouco","tem","têm","ser","estar","fazer",
            "isso","essa","esse","esta","este","minha","meu","minhas","meus","nossa","nosso",
            "sobre","ele","ela","eles","elas","voce","você","eu","nós","vos","lhe","lhes",
            "mas","também","já","ja","ainda","só","so","me","te","lo","la","num","numa","pelo","pela"
    );

    /**
     * Responde uma pergunta do usuário buscando cards relevantes (por frase completa e por
     * palavras-chave individuais — pg_trgm + correspondência por substring, ignorando acentos)
     * e injetando-os como contexto no Groq.
     * O conteúdo dos cards é armazenado como HTML (Tiptap) — strip é feito antes de
     * montar o prompt para evitar que tags vazem para a resposta.
     *
     * @param hideInterno true para excluir cards marcados como internos (funcionários externos)
     */
    public String responder(String pergunta, boolean hideInterno) {
        // Pergunta sobre a própria IA — responde direto, sem buscar documentos
        if (isIdentityQuestion(pergunta)) {
            return "Estou usando " + aiService.resolveCurrentProviderDisplayName() + ".";
        }

        List<Map<String, Object>> cards = buscarCardsRelevantes(pergunta, hideInterno);

        if (cards.isEmpty()) {
            return "Não encontrei informações sobre esse assunto nos documentos disponíveis.";
        }

        StringBuilder contexto = new StringBuilder();
        contexto.append("DOCUMENTOS:\n");

        for (Map<String, Object> card : cards) {
            String titulo   = String.valueOf(card.getOrDefault("title",       ""));
            String desc     = String.valueOf(card.getOrDefault("description", ""));
            String conteudo = stripHtml(String.valueOf(card.getOrDefault("content", "")));

            contexto.append("---\n");
            contexto.append("Título: ").append(titulo).append("\n");
            if (!desc.isBlank())     contexto.append("Resumo: ").append(desc).append("\n");
            if (!conteudo.isBlank()) contexto.append("Conteúdo: ").append(conteudo).append("\n");
        }

        contexto.append("---\n");
        contexto.append("PERGUNTA: ").append(pergunta).append("\n\n");
        contexto.append("Resposta (somente texto puro, sem HTML, sem formatação, apenas sobre a pergunta feita):");

        String providerName = aiService.resolveCurrentProviderDisplayName();
        String effectiveInstruction = SYSTEM_INSTRUCTION +
                "\n- Se o usuário perguntar qual IA, modelo ou assistente está sendo utilizado, responda apenas: " +
                "\"Estou usando " + providerName + ".\" Esta é a única exceção à regra de usar apenas os documentos fornecidos.";

        try {
            return aiService.generate(effectiveInstruction, contexto.toString()).content();
        } catch (AIQuotaExceededException e) {
            return e.getMessage();
        } catch (IllegalStateException e) {
            // Nenhum provedor de IA configurado em nenhum nível
            return e.getMessage();
        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            if (status == 401 || status == 403) {
                return "Erro de autenticação com o serviço de IA (HTTP " + status + "). Verifique a chave configurada em Integrações.";
            }
            if (status == 402) {
                return "Sua conta no provedor de IA não possui créditos suficientes (HTTP 402). Adicione créditos ou configure outro provedor em Integrações.";
            }
            return "Erro ao chamar o serviço de IA (HTTP " + status + "). Tente novamente.";
        } catch (ResourceAccessException e) {
            log.error("Chat IA: falha de conexão com provedor — {}", e.getMessage());
            return "Não foi possível conectar ao serviço de IA. Verifique se o provedor está acessível e a chave está correta em Integrações.";
        } catch (Exception e) {
            log.error("Chat IA: erro inesperado — {}: {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return "Desculpe, estou com dificuldades técnicas no momento. Tente novamente em instantes.";
        }
    }

    /** Detecta perguntas sobre o próprio provedor de IA em uso — respondidas sem buscar documentos. */
    private static boolean isIdentityQuestion(String pergunta) {
        String q = pergunta.toLowerCase();
        return q.contains("qual ia") || q.contains("que ia") ||
               q.contains("qual ai ") || q.contains("que ai ") ||
               q.contains("qual modelo") || q.contains("que modelo") ||
               q.contains("qual assistente") || q.contains("que assistente") ||
               q.contains("qual provedor") || q.contains("que provedor") ||
               q.contains("você é") || q.contains("voce é") || q.contains("voce e ") ||
               q.contains("quem é você") || q.contains("quem e voce");
    }

    /**
     * Busca cards relevantes tentando primeiro a pergunta inteira (favorece títulos colados
     * literalmente) e depois cada palavra-chave extraída isoladamente (favorece perguntas em
     * linguagem natural, com palavras fora de ordem ou com termos extras). Os resultados são
     * mesclados por id, mantendo a maior pontuação de relevância encontrada para cada card.
     */
    private List<Map<String, Object>> buscarCardsRelevantes(String pergunta, boolean hideInterno) {
        LinkedHashMap<Long, Map<String, Object>> melhores = new LinkedHashMap<>();
        Map<Long, Double> melhorScore = new HashMap<>();

        List<String> termos = new ArrayList<>();
        String fraseCompleta = pergunta.trim();
        if (!fraseCompleta.isEmpty()) termos.add(fraseCompleta);
        for (String palavra : extrairPalavrasChave(pergunta)) {
            if (!termos.contains(palavra)) termos.add(palavra);
        }

        for (String termo : termos) {
            for (Map<String, Object> card : cardRepository.searchByTerm(termo, hideInterno, 5)) {
                Long id = ((Number) card.get("id")).longValue();
                double score = ((Number) card.get("score")).doubleValue();
                if (score > melhorScore.getOrDefault(id, 0.0)) {
                    melhorScore.put(id, score);
                    melhores.put(id, card);
                }
            }
        }

        return melhores.values().stream()
                .sorted((a, b) -> Double.compare(
                        melhorScore.get(((Number) b.get("id")).longValue()),
                        melhorScore.get(((Number) a.get("id")).longValue())))
                .limit(3)
                .collect(Collectors.toList());
    }

    /** Extrai termos relevantes de uma pergunta em linguagem natural, descartando stop-words e termos curtos. */
    private List<String> extrairPalavrasChave(String pergunta) {
        return Arrays.stream(pergunta.toLowerCase().split("[^\\p{L}\\p{N}]+"))
                .filter(p -> p.length() >= 3 && !STOP_WORDS.contains(p))
                .distinct()
                .limit(6)
                .collect(Collectors.toList());
    }

    /** Remove todas as tags HTML e entidades comuns, retornando texto limpo. */
    private String stripHtml(String html) {
        if (html == null || html.isBlank() || "null".equals(html)) return "";
        return html
                .replaceAll("<br\\s*/?>",           "\n")
                .replaceAll("<li[^>]*>",             "\n- ")
                .replaceAll("<[^>]+>",               " ")
                .replaceAll("&nbsp;",                " ")
                .replaceAll("&amp;",                 "&")
                .replaceAll("&lt;",                  "<")
                .replaceAll("&gt;",                  ">")
                .replaceAll("&quot;",                "\"")
                .replaceAll("&#39;",                 "'")
                .replaceAll("[ \\t]+",               " ")
                .replaceAll("\\n{3,}",               "\n\n")
                .trim();
    }

    /** Mensagem de boas-vindas automática */
    public String boasVindas() {
        return "Olá! 👋 Sou o assistente virtual do UDoc. " +
               "Como posso te ajudar hoje? Pode me fazer uma pergunta sobre os documentos e treinamentos disponíveis. " +
               "Se precisar falar com seu ISM responsável, acesse a **aba ISM**. 😊";
    }
}
