package com.system.UDoc.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "company")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private Integer headquarters; // opcional

    @Column(nullable = false)
    private String name;

    @Column
    private String phone;

    @Column(unique = true, nullable = false)
    private String cnpj;

    @Column
    private String email;

    @Column
    private Integer employeeCount;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(columnDefinition = "TEXT")
    private String logo; // base64 da logo da empresa

    public Company() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getHeadquarters() { return headquarters; }
    public void setHeadquarters(Integer headquarters) { this.headquarters = headquarters; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Integer getEmployeeCount() { return employeeCount; }
    public void setEmployeeCount(Integer employeeCount) { this.employeeCount = employeeCount; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }
}
