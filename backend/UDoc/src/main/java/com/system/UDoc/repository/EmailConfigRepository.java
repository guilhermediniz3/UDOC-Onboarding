package com.system.UDoc.repository;

import com.system.UDoc.entity.EmailConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailConfigRepository extends JpaRepository<EmailConfig, Long> {

    Optional<EmailConfig> findFirstByOrderByIdAsc();
}
