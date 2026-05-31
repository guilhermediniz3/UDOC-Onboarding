package com.system.UDoc.dto;

import jakarta.validation.constraints.*;

public class LoginRequestDTO {
    @Email(message = "Invalid email") @NotBlank(message = "Email is required") private String email;
    @NotBlank(message = "Password is required") private String password;

    public LoginRequestDTO() {}
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
