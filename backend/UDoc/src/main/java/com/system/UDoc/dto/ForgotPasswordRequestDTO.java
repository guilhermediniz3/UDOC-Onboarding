package com.system.UDoc.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequestDTO {

    @Email(message = "Invalid email")
    @NotBlank(message = "Email is required")
    private String email;

    public ForgotPasswordRequestDTO() {
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
