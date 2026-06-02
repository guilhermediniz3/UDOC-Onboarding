package com.system.UDoc.dto;

import jakarta.validation.constraints.*;

public class CompanyRequestDTO {
    private Integer headquarters; // opcional — nem toda empresa tem matriz identificada
    @NotBlank(message = "Name is required") private String name;
    private String phone;
    @NotBlank(message = "CNPJ is required") @Size(min = 14, max = 18, message = "Invalid CNPJ")
    private String cnpj;
    @Email(message = "Invalid email") private String email;
    @Min(value = 0, message = "Employee count cannot be negative") private Integer employeeCount;
    @NotNull(message = "Status is required") private Boolean active;
    private String logo; // base64

    public CompanyRequestDTO() {}
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
