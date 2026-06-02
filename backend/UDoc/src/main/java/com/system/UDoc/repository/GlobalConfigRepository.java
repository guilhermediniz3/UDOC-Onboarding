package com.system.UDoc.repository;

import com.system.UDoc.entity.GlobalConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GlobalConfigRepository extends JpaRepository<GlobalConfig, String> {
    Optional<GlobalConfig> findByChave(String chave);
}
