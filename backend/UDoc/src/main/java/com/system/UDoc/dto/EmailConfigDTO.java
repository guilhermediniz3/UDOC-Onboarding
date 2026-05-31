package com.system.UDoc.dto;

import com.system.UDoc.entity.EmailConfig;

public class EmailConfigDTO {

    private Long id;
    private String host;
    private Integer port;
    private String username;
    private Boolean sslEnabled;
    private Boolean tlsEnabled;
    private String fromName;

    public EmailConfigDTO() {
    }

    public EmailConfigDTO(EmailConfig config) {
        this.id = config.getId();
        this.host = config.getHost();
        this.port = config.getPort();
        this.username = config.getUsername();
        this.sslEnabled = config.getSslEnabled();
        this.tlsEnabled = config.getTlsEnabled();
        this.fromName = config.getFromName();
        // password não é retornado por segurança
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Boolean getSslEnabled() { return sslEnabled; }
    public void setSslEnabled(Boolean sslEnabled) { this.sslEnabled = sslEnabled; }
    public Boolean getTlsEnabled() { return tlsEnabled; }
    public void setTlsEnabled(Boolean tlsEnabled) { this.tlsEnabled = tlsEnabled; }
    public String getFromName() { return fromName; }
    public void setFromName(String fromName) { this.fromName = fromName; }
}
