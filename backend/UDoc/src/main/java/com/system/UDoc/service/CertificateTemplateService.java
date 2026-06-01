package com.system.UDoc.service;
import com.system.UDoc.dto.CertificateTemplateDTO;
import com.system.UDoc.entity.CertificateTemplate;
import com.system.UDoc.repository.CertificateTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class CertificateTemplateService {
    private final CertificateTemplateRepository repo;
    public CertificateTemplateService(CertificateTemplateRepository repo) { this.repo = repo; }
    @Transactional(readOnly = true)
    public CertificateTemplateDTO getTemplate() {
        return repo.findFirstByOrderByIdAsc().map(CertificateTemplateDTO::new).orElseGet(() -> {
            CertificateTemplateDTO dto = new CertificateTemplateDTO();
            dto.setPrimaryColor("#7c3aed"); return dto;
        });
    }
    @Transactional
    public CertificateTemplateDTO saveTemplate(CertificateTemplateDTO req) {
        CertificateTemplate t = repo.findFirstByOrderByIdAsc().orElse(new CertificateTemplate());
        if (req.getLogoBase64() != null) t.setLogoBase64(req.getLogoBase64());
        if (req.getSignatureName() != null) t.setSignatureName(req.getSignatureName());
        if (req.getSignatureTitle() != null) t.setSignatureTitle(req.getSignatureTitle());
        if (req.getAdditionalContent() != null) t.setAdditionalContent(req.getAdditionalContent());
        if (req.getPrimaryColor() != null) t.setPrimaryColor(req.getPrimaryColor());
        return new CertificateTemplateDTO(repo.save(t));
    }
}
