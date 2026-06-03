package com.system.UDoc.config;

import com.system.UDoc.entity.Role;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Cria o admin padrão apenas quando o banco está vazio (primeira execução).
 * Roda DEPOIS do DataInitializer (@Order(1)) para garantir que as migrações
 * de schema já foram aplicadas.
 */
@Component
@Order(2)
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) return;

        User admin = new User();
        admin.setName("Administrador");
        admin.setEmail("admin@admin.com");
        admin.setPassword(passwordEncoder.encode("admin1234"));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        admin.setForcePasswordChange(true);
        userRepository.save(admin);

        log.info(">>> Admin padrão criado: admin@admin.com / admin123 — altere a senha no primeiro acesso.");
    }
}
