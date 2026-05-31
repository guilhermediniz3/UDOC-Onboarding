package com.system.UDoc.service;

import com.system.UDoc.entity.EmailConfig;
import com.system.UDoc.repository.EmailConfigRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Properties;

@Service
public class EmailService {

    private final EmailConfigRepository emailConfigRepository;
    private final JavaMailSender defaultMailSender;

    @Value("${app.mail.from-address:noreply@udoc.com}")
    private String defaultFromAddress;

    @Value("${app.mail.from-name:UDoc}")
    private String defaultFromName;

    public EmailService(
            EmailConfigRepository emailConfigRepository,
            JavaMailSender defaultMailSender
    ) {
        this.emailConfigRepository = emailConfigRepository;
        this.defaultMailSender = defaultMailSender;
    }

    public void sendPasswordReset(String toEmail, String userName, String resetLink) {

        Optional<EmailConfig> customConfig = emailConfigRepository.findFirstByOrderByIdAsc();

        JavaMailSender sender = customConfig
                .map(this::buildFromConfig)
                .orElse(defaultMailSender);

        String fromAddress = customConfig
                .map(EmailConfig::getUsername)
                .orElse(defaultFromAddress);

        String fromName = customConfig
                .map(EmailConfig::getFromName)
                .orElse(defaultFromName);

        try {
            var mimeMessage = sender.createMimeMessage();
            var helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("UDoc — Redefinição de senha");
            helper.setText(buildEmailBody(userName, resetLink), true);

            sender.send(mimeMessage);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to send email. Check SendGrid API key or SMTP settings. " + e.getMessage(), e
            );
        }
    }

    private JavaMailSender buildFromConfig(EmailConfig config) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(config.getHost());
        sender.setPort(config.getPort());
        sender.setUsername(config.getUsername());
        sender.setPassword(config.getPassword());

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", String.valueOf(config.getTlsEnabled()));
        props.put("mail.smtp.ssl.enable", String.valueOf(config.getSslEnabled()));

        return sender;
    }

    private String buildEmailBody(String userName, String resetLink) {
        return """
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">UDoc — Redefinição de senha</h2>
              <p>Olá, <strong>%s</strong>!</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
              <p>Clique no botão abaixo para criar uma nova senha.
                 Este link expira em <strong>1 hora</strong>.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="%s"
                   style="background: linear-gradient(to right, #7c3aed, #2563eb);
                          color: white; padding: 12px 28px; border-radius: 24px;
                          text-decoration: none; font-weight: bold;">
                  Redefinir senha
                </a>
              </div>
              <p style="color: #6b7280; font-size: 13px;">
                Se você não solicitou a redefinição, ignore este e-mail.
              </p>
            </div>
            """.formatted(userName, resetLink);
    }
}
