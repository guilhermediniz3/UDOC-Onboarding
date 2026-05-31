package com.system.UDoc.dto;

import com.system.UDoc.entity.Ism;

public class IsmDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String photo;
    private Boolean active;
    private Long userId;
    private String userEmail;

    public IsmDTO() {}
    public IsmDTO(Ism ism) {
        this.id = ism.getId(); this.name = ism.getName(); this.email = ism.getEmail();
        this.phone = ism.getPhone(); this.photo = ism.getPhoto(); this.active = ism.getActive();
        if (ism.getUser() != null) { this.userId = ism.getUser().getId(); this.userEmail = ism.getUser().getEmail(); }
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
}
