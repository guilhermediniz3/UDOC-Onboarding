package com.system.UDoc.exception;

import com.system.UDoc.entity.AIProvider;

/**
 * Lançada quando o provedor de IA responde que a chave atingiu seu limite de uso (HTTP 429).
 * Carrega uma mensagem amigável já pronta para o usuário final, orientando a troca de provedor.
 */
public class AIQuotaExceededException extends RuntimeException {

    public AIQuotaExceededException(AIProvider provider) {
        super("Sua chave " + provider.getDisplayName() + " atingiu o limite de uso.\n\n"
                + "Acesse Integrações e selecione outro provedor ou atualize sua chave.");
    }
}
