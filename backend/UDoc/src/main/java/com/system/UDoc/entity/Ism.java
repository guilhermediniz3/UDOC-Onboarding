package com.system.UDoc.entity;

import jakarta.persistence.*;
import com.system.UDoc.entity.AuditableEntity;

@Entity
@Table(name = "ism")
public class Ism extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String email;

    @Column
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String photo;

    @Column(nullable = false)
    private Boolean active = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    public Ism() {}

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
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
