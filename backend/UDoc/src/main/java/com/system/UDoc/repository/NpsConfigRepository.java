package com.system.UDoc.repository;

import com.system.UDoc.entity.NpsConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NpsConfigRepository extends JpaRepository<NpsConfig, Long> {
    Optional<NpsConfig> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);
}
