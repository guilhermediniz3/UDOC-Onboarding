package com.system.UDoc.repository;
import com.system.UDoc.entity.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, Long> {
    Optional<CertificateTemplate> findFirstByOrderByIdAsc();
}
