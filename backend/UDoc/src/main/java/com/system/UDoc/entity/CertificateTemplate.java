package com.system.UDoc.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "certificate_template")
public class CertificateTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(columnDefinition = "TEXT") private String logoBase64;
    @Column private String signatureName;
    @Column private String signatureTitle;
    @Column(columnDefinition = "TEXT") private String additionalContent;
    @Column private String primaryColor = "#7c3aed";
    public CertificateTemplate() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getLogoBase64() { return logoBase64; } public void setLogoBase64(String v) { this.logoBase64 = v; }
    public String getSignatureName() { return signatureName; } public void setSignatureName(String v) { this.signatureName = v; }
    public String getSignatureTitle() { return signatureTitle; } public void setSignatureTitle(String v) { this.signatureTitle = v; }
    public String getAdditionalContent() { return additionalContent; } public void setAdditionalContent(String v) { this.additionalContent = v; }
    public String getPrimaryColor() { return primaryColor; } public void setPrimaryColor(String v) { this.primaryColor = v; }
}
