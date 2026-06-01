package com.system.UDoc.dto;

import com.system.UDoc.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UserRequestDTO {
    @NotBlank(message = "Name is required")
    private String name;
    @Email(message = "Invalid email") @NotBlank(message = "Email is required")
    private String email;
    private String photo;
    private String password;
    @NotNull(message = "Role is required")
    private Role role;
    @NotNull(message = "Status is required")
    private Boolean active;

    private Long employeeId; // vínculo opcional com Funcionário Externo

    public UserRequestDTO() {}
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
}
