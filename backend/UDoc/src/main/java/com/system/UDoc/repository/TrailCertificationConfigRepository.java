package com.system.UDoc.repository;
import com.system.UDoc.entity.TrailCertificationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface TrailCertificationConfigRepository extends JpaRepository<TrailCertificationConfig, Long> {
    Optional<TrailCertificationConfig> findByTrailId(Long trailId);
}
