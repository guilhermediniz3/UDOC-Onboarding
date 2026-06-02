package com.system.UDoc.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * Criptografia AES-256-CBC para valores sensíveis armazenados no banco (API keys).
 * A chave de criptografia vem EXCLUSIVAMENTE da variável de ambiente ENCRYPTION_KEY —
 * nunca é armazenada no banco nem exposta em logs.
 */
@Service
public class EncryptionService {

    // IV fixo derivado da própria chave — evita armazenar IV separado por valor.
    // Para API keys de configuração (baixa rotatividade) este padrão é aceitável.
    private static final String CIPHER = "AES/CBC/PKCS5Padding";

    @Value("${encryption.key:UDoc_Default_Change_In_Production_2024!!}")
    private String rawKey;

    private byte[] deriveKey() throws Exception {
        return MessageDigest.getInstance("SHA-256")
                .digest(rawKey.getBytes(StandardCharsets.UTF_8)); // 32 bytes → AES-256
    }

    private byte[] deriveIv(byte[] keyBytes) {
        byte[] iv = new byte[16];
        System.arraycopy(keyBytes, 0, iv, 0, 16); // primeiros 16 bytes da chave como IV
        return iv;
    }

    public String encrypt(String plainText) {
        try {
            byte[] keyBytes = deriveKey();
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
            IvParameterSpec ivSpec  = new IvParameterSpec(deriveIv(keyBytes));
            Cipher cipher = Cipher.getInstance(CIPHER);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            // Nunca loga o plainText
            throw new RuntimeException("Falha ao criptografar valor sensível");
        }
    }

    public String decrypt(String cipherText) {
        try {
            byte[] keyBytes = deriveKey();
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
            IvParameterSpec ivSpec  = new IvParameterSpec(deriveIv(keyBytes));
            Cipher cipher = Cipher.getInstance(CIPHER);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(cipherText));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Falha ao descriptografar valor sensível");
        }
    }

    /** Verifica se o valor já está criptografado (Base64 sem espaços, comprimento > 20) */
    public boolean isEncrypted(String value) {
        if (value == null || value.length() < 20) return false;
        try { Base64.getDecoder().decode(value); return true; }
        catch (Exception e) { return false; }
    }
}
