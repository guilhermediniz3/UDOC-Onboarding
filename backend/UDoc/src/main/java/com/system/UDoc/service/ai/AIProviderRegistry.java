package com.system.UDoc.service.ai;

import com.system.UDoc.entity.AIProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

/** Monta e expõe o client (estratégia) correspondente a cada provedor de IA suportado. */
@Component
public class AIProviderRegistry {

    private final Map<AIProvider, AIProviderClient> clients = new EnumMap<>(AIProvider.class);

    public AIProviderRegistry(
            @Value("${ai.model:llama-3.3-70b-versatile}") String groqDefaultModel,
            @Value("${ai.ollama.url:http://localhost:11434/v1/chat/completions}") String ollamaUrl) {
        clients.put(AIProvider.GROQ,
                new OpenAICompatibleClient("https://api.groq.com/openai/v1/chat/completions", groqDefaultModel));
        clients.put(AIProvider.OPENAI,
                new OpenAICompatibleClient("https://api.openai.com/v1/chat/completions", "gpt-4o-mini"));
        clients.put(AIProvider.DEEPSEEK,
                new OpenAICompatibleClient("https://api.deepseek.com/chat/completions", "deepseek-chat"));
        clients.put(AIProvider.GEMINI, new GeminiClient());
        clients.put(AIProvider.CLAUDE, new ClaudeClient());
        // Provedores locais via Ollama — mesma URL, modelos diferentes
        clients.put(AIProvider.OLLAMA, new OpenAICompatibleClient(ollamaUrl, "llama3.1:8b"));
        clients.put(AIProvider.QWEN,   new OpenAICompatibleClient(ollamaUrl, "qwen2.5:7b"));
    }

    public AIProviderClient get(AIProvider provider) {
        return clients.get(provider);
    }
}
