package com.system.UDoc.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User extends AuditableEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(columnDefinition = "TEXT")
    private String photo;

    @Column
    private String resetToken;

    @Column
    private LocalDateTime resetTokenExpiry;

    /** Chave pessoal de IA (Groq), criptografada — usada no lugar da chave geral quando preenchida */
    @Column(columnDefinition = "TEXT")
    private String aiApiKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean forcePasswordChange = false;

    public User() {}

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority(role.name())); }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return Boolean.TRUE.equals(active); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public boolean isForcePasswordChange() { return forcePasswordChange; }
    public void setForcePasswordChange(boolean v) { this.forcePasswordChange = v; }
    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    public LocalDateTime getResetTokenExpiry() { return resetTokenExpiry; }
    public void setResetTokenExpiry(LocalDateTime v) { this.resetTokenExpiry = v; }
    public String getAiApiKey() { return aiApiKey; }
    public void setAiApiKey(String aiApiKey) { this.aiApiKey = aiApiKey; }
}
