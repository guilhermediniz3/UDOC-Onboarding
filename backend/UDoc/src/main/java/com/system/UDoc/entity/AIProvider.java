package com.system.UDoc.entity;

/** Provedores de IA suportados para geração de conteúdo (mesmo prompt/fluxo, motor plugável). */
public enum AIProvider {
    GROQ("Groq", "gsk_..."),
    GEMINI("Gemini", "AIza..."),
    OPENAI("GPT (OpenAI)", "sk-..."),
    DEEPSEEK("DeepSeek", "sk-..."),
    CLAUDE("Claude", "sk-ant-..."),
    OLLAMA("Ollama / Llama", "llama3.1:8b"),
    QWEN("Ollama / Qwen", "qwen2.5:7b");

    private final String displayName;
    private final String keyPlaceholder;

    AIProvider(String displayName, String keyPlaceholder) {
        this.displayName = displayName;
        this.keyPlaceholder = keyPlaceholder;
    }

    public String getDisplayName() { return displayName; }
    public String getKeyPlaceholder() { return keyPlaceholder; }

    /** Provedores locais (Ollama) não precisam de chave — o campo armazena o nome do modelo. */
    public boolean isLocal() { return this == OLLAMA || this == QWEN; }

    /** Conversão tolerante — usada ao ler valores persistidos/legados. Retorna null se desconhecido/ausente. */
    public static AIProvider fromString(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return AIProvider.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
