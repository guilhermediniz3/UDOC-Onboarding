package com.system.UDoc.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String phone;

    @Column
    private String email;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(columnDefinition = "TEXT")
    private String photo;

    @Column(nullable = false)
    private Boolean active = true;

    /** "EXTERNO" = funcionário das empresas clientes | "INTERNO" = funcionário da empresa que fornece o treinamento */
    @Column(nullable = false, length = 20)
    private String tipo = "EXTERNO";

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    /** ISM responsável pelo atendimento deste funcionário externo no chat */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ism_id")
    private Ism ism;

    /** Habilita a aba de chat com ISM para este funcionário externo (padrão ON) */
    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean chatIsmHabilitado = true;

    public Employee() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Ism getIsm() { return ism; }
    public void setIsm(Ism ism) { this.ism = ism; }
    public Boolean getChatIsmHabilitado() { return chatIsmHabilitado != null && chatIsmHabilitado; }
    public void setChatIsmHabilitado(Boolean v) { this.chatIsmHabilitado = v != null && v; }
}
