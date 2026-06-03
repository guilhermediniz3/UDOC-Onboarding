package com.system.UDoc.dto;

import jakarta.validation.constraints.*;

public class EmployeeRequestDTO {
    @NotBlank(message = "Name is required") private String name;
    private String phone;
    @Email(message = "Invalid email") private String email;
    private String photo;
    @NotNull(message = "Company is required") private Long companyId;
    @NotNull(message = "Status is required") private Boolean active;
    private Long userId;
    private String tipo; // "EXTERNO" | "INTERNO" (default EXTERNO)
    private Long ismId;
    private Boolean chatIsmHabilitado;

    public EmployeeRequestDTO() {}
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Long getIsmId() { return ismId; }
    public void setIsmId(Long v) { this.ismId = v; }
    public Boolean getChatIsmHabilitado() { return chatIsmHabilitado; }
    public void setChatIsmHabilitado(Boolean v) { this.chatIsmHabilitado = v; }
}
