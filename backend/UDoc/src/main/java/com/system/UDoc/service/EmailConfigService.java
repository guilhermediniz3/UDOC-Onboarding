package com.system.UDoc.service;

import com.system.UDoc.dto.EmailConfigDTO;
import com.system.UDoc.dto.EmailConfigRequestDTO;
import com.system.UDoc.entity.EmailConfig;
import com.system.UDoc.repository.EmailConfigRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class EmailConfigService {

    private final EmailConfigRepository emailConfigRepository;

    public EmailConfigService(EmailConfigRepository emailConfigRepository) {
        this.emailConfigRepository = emailConfigRepository;
    }

    @Transactional(readOnly = true)
    public EmailConfigDTO getConfig() {
        return emailConfigRepository.findFirstByOrderByIdAsc()
                .map(EmailConfigDTO::new)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Email configuration not found"
                ));
    }

    @Transactional(readOnly = true)
    public Optional<EmailConfig> getRawConfig() {
        return emailConfigRepository.findFirstByOrderByIdAsc();
    }

    @Transactional
    public EmailConfigDTO saveConfig(EmailConfigRequestDTO request) {
        // Campos em branco = usuário quer voltar ao SendGrid padrão
        if (request.getHost() == null || request.getHost().isBlank()) {
            deleteConfig();
            return null;
        }

        EmailConfig config = emailConfigRepository.findFirstByOrderByIdAsc()
                .orElse(new EmailConfig());

        config.setHost(request.getHost());
        config.setPort(request.getPort());
        config.setUsername(request.getUsername());
        config.setFromName(request.getFromName() != null ? request.getFromName() : "UDoc");
        config.setSslEnabled(request.getSslEnabled());
        config.setTlsEnabled(request.getTlsEnabled());

        // Só atualiza senha se foi informada
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            config.setPassword(request.getPassword());
        }

        return new EmailConfigDTO(emailConfigRepository.save(config));
    }

    /** Remove a configuração SMTP personalizada — o sistema volta a usar o SendGrid padrão */
    @Transactional
    public void deleteConfig() {
        emailConfigRepository.findFirstByOrderByIdAsc().ifPresent(emailConfigRepository::delete);
    }
}
