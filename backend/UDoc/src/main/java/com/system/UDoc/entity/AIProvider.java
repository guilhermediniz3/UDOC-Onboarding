package com.system.UDoc.entity;

/** Provedores de IA suportados para geração de conteúdo (mesmo prompt/fluxo, motor plugável). */
public enum AIProvider {
    GROQ("Groq", "gsk_..."),
    GEMINI("Gemini", "AIza..."),
    OPENAI("GPT (OpenAI)", "sk-..."),
    DEEPSEEK("DeepSeek", "sk-..."),
    CLAUDE("Claude", "sk-ant-...");

    private final String displayName;
    private final String keyPlaceholder;

    AIProvider(String displayName, String keyPlaceholder) {
        this.displayName = displayName;
        this.keyPlaceholder = keyPlaceholder;
    }

    public String getDisplayName() { return displayName; }
    public String getKeyPlaceholder() { return keyPlaceholder; }

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
