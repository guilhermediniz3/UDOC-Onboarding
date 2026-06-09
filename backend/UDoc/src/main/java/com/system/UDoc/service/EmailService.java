package com.system.UDoc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.system.UDoc.entity.EmailConfig;
import com.system.UDoc.repository.EmailConfigRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;

@Service
public class EmailService {

    private final EmailConfigRepository emailConfigRepository;
    private final JavaMailSender defaultMailSender;
    private final GlobalConfigService globalConfig;
    private final ObjectMapper objectMapper;

    @Value("${app.mail.from-address:noreply@udoc.com}")
    private String defaultFromAddress;

    @Value("${app.mail.from-name:UDoc}")
    private String defaultFromName;

    public EmailService(
            EmailConfigRepository emailConfigRepository,
            JavaMailSender defaultMailSender,
            GlobalConfigService globalConfig,
            ObjectMapper objectMapper
    ) {
        this.emailConfigRepository = emailConfigRepository;
        this.defaultMailSender = defaultMailSender;
        this.globalConfig = globalConfig;
        this.objectMapper = objectMapper;
    }

    private String resolveFromAddress() {
        String dbFrom = globalConfig.getStringValue(GlobalConfigService.KEY_MAIL_FROM);
        return (dbFrom != null && !dbFrom.isBlank()) ? dbFrom : defaultFromAddress;
    }

    @Async("emailExecutor")
    public void sendPasswordReset(String toEmail, String userName, String resetLink) {
        dispatch(toEmail, "UDoc — Redefinição de senha", buildEmailBody(userName, resetLink));
    }

    @Async("emailExecutor")
    public void sendTrainingInvite(String toEmail, String employeeName,
                                   String roomTitle, String jitsiLink, String ismName) {
        dispatch(toEmail, "UDoc — Convite para treinamento ao vivo: " + roomTitle,
                buildTrainingInviteBody(employeeName, roomTitle, jitsiLink, ismName));
    }

    @Async("emailExecutor")
    public void sendWelcomeEmail(String toEmail, String userName, String setPasswordLink) {
        dispatch(toEmail, "UDoc — Bem-vindo! Defina sua senha",
                buildWelcomeEmailBody(userName, setPasswordLink));
    }

    /**
     * Prioridade:
     * 1. email_config personalizado (SMTP custom)
     * 2. sendgrid_api_key no global_config → HTTP API (sem bloqueio de porta)
     * 3. defaultMailSender (application.properties)
     */
    private void dispatch(String toEmail, String subject, String htmlContent) {
        Optional<EmailConfig> custom = emailConfigRepository.findFirstByOrderByIdAsc();
        if (custom.isPresent()) {
            sendViaSMTP(buildFromConfig(custom.get()),
                    custom.get().getUsername(), custom.get().getFromName(),
                    toEmail, subject, htmlContent);
            return;
        }

        String sgKey = globalConfig.getStringValue(GlobalConfigService.KEY_SENDGRID_API_KEY);
        if (sgKey != null && !sgKey.isBlank()) {
            sendViaSendGridApi(sgKey, resolveFromAddress(), defaultFromName,
                    toEmail, subject, htmlContent);
            return;
        }

        sendViaSMTP(defaultMailSender, resolveFromAddress(), defaultFromName,
                toEmail, subject, htmlContent);
    }

    private void sendViaSMTP(JavaMailSender sender, String fromAddress, String fromName,
                              String toEmail, String subject, String htmlContent) {
        try {
            var msg = sender.createMimeMessage();
            var helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            sender.send(msg);
        } catch (Exception e) {
            throw new IllegalStateException("Falha no envio SMTP: " + e.getMessage(), e);
        }
    }

    /** Envia via SendGrid HTTP API (porta 443) — não sofre bloqueio de porta SMTP */
    private void sendViaSendGridApi(String apiKey, String fromAddress, String fromName,
                                    String toEmail, String subject, String htmlContent) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("personalizations", List.of(
                    Map.of("to", List.of(Map.of("email", toEmail)))
            ));
            body.put("from", Map.of("email", fromAddress, "name", fromName));
            body.put("subject", subject);
            body.put("content", List.of(Map.of("type", "text/html", "value", htmlContent)));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            String json = objectMapper.writeValueAsString(body);
            var entity = new HttpEntity<>(json, headers);

            new RestTemplate().postForEntity(
                    "https://api.sendgrid.com/v3/mail/send", entity, String.class);

        } catch (Exception e) {
            throw new IllegalStateException("Falha no envio via SendGrid API: " + e.getMessage(), e);
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

    private String buildWelcomeEmailBody(String userName, String link) {
        return """
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">Bem-vindo ao UDoc!</h2>
              <p>Olá, <strong>%s</strong>!</p>
              <p>Sua conta foi criada no sistema UDoc. Clique no botão abaixo para definir sua senha
                 e acessar a plataforma.</p>
              <p style="color: #6b7280; font-size: 13px;">
                Este link é válido por <strong>24 horas</strong>.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="%s"
                   style="background: linear-gradient(to right, #7c3aed, #2563eb);
                          color: white; padding: 12px 28px; border-radius: 24px;
                          text-decoration: none; font-weight: bold;">
                  Definir minha senha
                </a>
              </div>
              <p style="color: #6b7280; font-size: 12px;">
                Caso o botão não funcione, copie e cole este link no navegador:<br/>
                <a href="%s" style="color: #7c3aed;">%s</a>
              </p>
            </div>
            """.formatted(userName, link, link, link);
    }

    private String buildTrainingInviteBody(String name, String title, String link, String ism) {
        return """
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">Convite para Treinamento ao Vivo</h2>
              <p>Olá, <strong>%s</strong>!</p>
              <p>O treinamento <strong>"%s"</strong> está iniciando agora.</p>
              %s
              <p>Clique no botão abaixo para entrar na sala:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="%s"
                   style="background: linear-gradient(to right, #22c55e, #16a34a);
                          color: white; padding: 14px 32px; border-radius: 24px;
                          text-decoration: none; font-weight: bold; font-size: 16px;">
                  ▶ Entrar no Treinamento
                </a>
              </div>
              <p style="color: #6b7280; font-size: 12px;">
                Caso o botão não funcione, acesse:<br/>
                <a href="%s" style="color: #7c3aed;">%s</a>
              </p>
            </div>
            """.formatted(name, title,
                ism != null && !ism.isBlank()
                        ? "<p style='color:#6b7280;'>Responsável: <strong>" + ism + "</strong></p>"
                        : "",
                link, link, link);
    }
}
