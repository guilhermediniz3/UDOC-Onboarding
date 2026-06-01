package com.system.UDoc.dto;
import com.system.UDoc.entity.CertificateTemplate;
public class CertificateTemplateDTO {
    private Long id; private String logoBase64; private String signatureName;
    private String signatureTitle; private String additionalContent; private String primaryColor;
    public CertificateTemplateDTO() {}
    public CertificateTemplateDTO(CertificateTemplate t) {
        this.id = t.getId(); this.logoBase64 = t.getLogoBase64(); this.signatureName = t.getSignatureName();
        this.signatureTitle = t.getSignatureTitle(); this.additionalContent = t.getAdditionalContent(); this.primaryColor = t.getPrimaryColor();
    }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getLogoBase64() { return logoBase64; } public void setLogoBase64(String v) { this.logoBase64 = v; }
    public String getSignatureName() { return signatureName; } public void setSignatureName(String v) { this.signatureName = v; }
    public String getSignatureTitle() { return signatureTitle; } public void setSignatureTitle(String v) { this.signatureTitle = v; }
    public String getAdditionalContent() { return additionalContent; } public void setAdditionalContent(String v) { this.additionalContent = v; }
    public String getPrimaryColor() { return primaryColor; } public void setPrimaryColor(String v) { this.primaryColor = v; }
}
