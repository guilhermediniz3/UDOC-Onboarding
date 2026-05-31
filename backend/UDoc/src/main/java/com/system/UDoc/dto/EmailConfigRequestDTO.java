package com.system.UDoc.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class EmailConfigRequestDTO {

    @NotBlank(message = "Host is required")
    private String host;

    @NotNull(message = "Port is required")
    @Min(value = 1, message = "Invalid port")
    private Integer port;

    @NotBlank(message = "Email is required")
    private String username;

    private String password;

    @NotNull(message = "SSL configuration is required")
    private Boolean sslEnabled;

    @NotNull(message = "TLS configuration is required")
    private Boolean tlsEnabled;

    private String fromName;

    public EmailConfigRequestDTO() {
    }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Boolean getSslEnabled() { return sslEnabled; }
    public void setSslEnabled(Boolean sslEnabled) { this.sslEnabled = sslEnabled; }
    public Boolean getTlsEnabled() { return tlsEnabled; }
    public void setTlsEnabled(Boolean tlsEnabled) { this.tlsEnabled = tlsEnabled; }
    public String getFromName() { return fromName; }
    public void setFromName(String fromName) { this.fromName = fromName; }
}
