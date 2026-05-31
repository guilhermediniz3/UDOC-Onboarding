package com.system.UDoc.dto;

import com.system.UDoc.entity.Role;
import jakarta.validation.constraints.*;

public class RegisterRequestDTO {
    @NotBlank(message = "Name is required") private String name;
    @Email(message = "Invalid email") @NotBlank(message = "Email is required") private String email;
    @NotBlank(message = "Password is required") @Size(min = 6, message = "Password must be at least 6 characters") private String password;
    @NotNull(message = "Role is required") private Role role;

    public RegisterRequestDTO() {}
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
