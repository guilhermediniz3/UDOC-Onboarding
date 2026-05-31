package com.system.UDoc.dto;

public class AuthResponseDTO {
    private String token;
    private Long id;
    private String name;
    private String email;
    private String photo;
    private String role;

    public AuthResponseDTO() {}
    public AuthResponseDTO(String token, Long id, String name, String email, String photo, String role) {
        this.token = token; this.id = id; this.name = name;
        this.email = email; this.photo = photo; this.role = role;
    }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
