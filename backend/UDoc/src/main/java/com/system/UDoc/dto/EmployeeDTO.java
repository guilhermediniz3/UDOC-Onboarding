package com.system.UDoc.dto;

import com.system.UDoc.entity.Employee;

public class EmployeeDTO {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String photo;
    private Long companyId;
    private String companyName;
    private Long userId;
    private Boolean active;

    public EmployeeDTO() {}
    public EmployeeDTO(Employee e) {
        this.id = e.getId(); this.name = e.getName(); this.phone = e.getPhone();
        this.email = e.getEmail(); this.photo = e.getPhoto();
        this.companyId = e.getCompany().getId(); this.companyName = e.getCompany().getName();
        this.active = e.getActive();
        if (e.getUser() != null) this.userId = e.getUser().getId();
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
