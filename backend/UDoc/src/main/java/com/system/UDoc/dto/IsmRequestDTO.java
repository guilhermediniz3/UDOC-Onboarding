package com.system.UDoc.dto;

import jakarta.validation.constraints.*;

public class IsmRequestDTO {
    @NotBlank(message = "Name is required") private String name;
    @Email(message = "Invalid email") private String email;
    private String phone;
    private String photo;
    @NotNull(message = "Status is required") private Boolean active;
    private Long userId;

    public IsmRequestDTO() {}
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
