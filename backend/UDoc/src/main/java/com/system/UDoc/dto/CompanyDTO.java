package com.system.UDoc.dto;

import com.system.UDoc.entity.Company;

public class CompanyDTO {
    private Long id;
    private Integer headquarters;
    private String name;
    private String phone;
    private String cnpj;
    private String email;
    private Integer employeeCount;
    private Boolean active;
    private String logo;

    public CompanyDTO() {}
    public CompanyDTO(Company c) {
        this.id = c.getId(); this.headquarters = c.getHeadquarters(); this.name = c.getName();
        this.phone = c.getPhone(); this.cnpj = c.getCnpj(); this.email = c.getEmail();
        this.employeeCount = c.getEmployeeCount(); this.active = c.getActive();
        this.logo = c.getLogo();
    }
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
