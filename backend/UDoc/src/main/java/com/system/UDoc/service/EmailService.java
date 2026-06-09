package com.system.UDoc.service;

import com.system.UDoc.entity.EmailConfig;
import com.system.UDoc.repository.EmailConfigRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Properties;

@Service
public class EmailService {

    private final EmailConfigRepository emailConfigRepository;
    private final JavaMailSender defaultMailSender;
    private final GlobalConfigService globalConfig;

    @Value("${app.mail.from-address:noreply@udoc.com}")
    private String defaultFromAddress;

    @Value("${app.mail.from-name:UDoc}")
    private String defaultFromName;

    public EmailService(
            EmailConfigRepository emailConfigRepository,
            JavaMailSender defaultMailSender,
            GlobalConfigService globalConfig
    ) {
        this.emailConfigRepository = emailConfigRepository;
        this.defaultMailSender = defaultMailSender;
        this.globalConfig = globalConfig;
    }

    /** Resolve o sender padrão: DB SendGrid key > application.properties */
    private JavaMailSender resolveDefaultSender() {
        String dbKey = globalConfig.getStringValue(GlobalConfigService.KEY_SENDGRID_API_KEY);
        if (dbKey != null && !dbKey.isBlank()) return buildSendGridSender(dbKey);
        return defaultMailSender;
    }

    /** Resolve o endereço de origem padrão: DB mail_from > application.properties */
    private String resolveFromAddress() {
        String dbFrom = globalConfig.getStringValue(GlobalConfigService.KEY_MAIL_FROM);
        return (dbFrom != null && !dbFrom.isBlank()) ? dbFrom : defaultFromAddress;
    }

    private JavaMailSender buildSendGridSender(String apiKey) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("smtp.sendgrid.net");
        sender.setPort(587);
        sender.setUsername("apikey");
        sender.setPassword(apiKey);
        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.ssl.enable", "false");
        return sender;
    }

    @Async("emailExecutor")
    public void sendPasswordReset(String toEmail, String userName, String resetLink) {

        Optional<EmailConfig> customConfig = emailConfigRepository.findFirstByOrderByIdAsc();

        JavaMailSender sender    = customConfig.isPresent() ? buildFromConfig(customConfig.get()) : resolveDefaultSender();
        String fromAddress = customConfig.isPresent() ? customConfig.get().getUsername()  : resolveFromAddress();
        String fromName    = customConfig.isPresent() ? customConfig.get().getFromName()  : defaultFromName;

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

    @Async("emailExecutor")
    public void sendTrainingInvite(String toEmail, String employeeName,
                                   String roomTitle, String jitsiLink, String ismName) {
        Optional<EmailConfig> customConfig = emailConfigRepository.findFirstByOrderByIdAsc();
        JavaMailSender sender    = customConfig.isPresent() ? buildFromConfig(customConfig.get()) : resolveDefaultSender();
        String fromAddress = customConfig.isPresent() ? customConfig.get().getUsername()  : resolveFromAddress();
        String fromName    = customConfig.isPresent() ? customConfig.get().getFromName()  : defaultFromName;
        try {
            var mimeMessage = sender.createMimeMessage();
            var helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("UDoc — Convite para treinamento ao vivo: " + roomTitle);
            helper.setText(buildTrainingInviteBody(employeeName, roomTitle, jitsiLink, ismName), true);
            sender.send(mimeMessage);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao enviar convite de treinamento: " + e.getMessage(), e);
        }
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
                         ism != null && !ism.isBlank() ? "<p style='color:#6b7280;'>Responsável: <strong>" + ism + "</strong></p>" : "",
                         link, link, link);
    }

    @Async("emailExecutor")
    public void sendWelcomeEmail(String toEmail, String userName, String setPasswordLink) {
        Optional<EmailConfig> customConfig = emailConfigRepository.findFirstByOrderByIdAsc();
        JavaMailSender sender    = customConfig.isPresent() ? buildFromConfig(customConfig.get()) : resolveDefaultSender();
        String fromAddress = customConfig.isPresent() ? customConfig.get().getUsername()  : resolveFromAddress();
        String fromName    = customConfig.isPresent() ? customConfig.get().getFromName()  : defaultFromName;
        try {
            var mimeMessage = sender.createMimeMessage();
            var helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("UDoc — Bem-vindo! Defina sua senha");
            helper.setText(buildWelcomeEmailBody(userName, setPasswordLink), true);
            sender.send(mimeMessage);
        } catch (Exception e) {
            throw new IllegalStateException(
                "Failed to send welcome email. Check SMTP settings. " + e.getMessage(), e);
        }
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
