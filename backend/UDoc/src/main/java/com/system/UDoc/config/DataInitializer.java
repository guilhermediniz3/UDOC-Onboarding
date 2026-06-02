package com.system.UDoc.config;

import com.system.UDoc.entity.Role;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbc
    ) {
        return args -> {

            // ── Migração: tornar nulas colunas antigas renomeadas ──────────────
            // Quando a entidade foi traduzida PT→EN, o ddl-auto=update criou as
            // novas colunas mas manteve as antigas com NOT NULL, causando erro.
            runSilently(jdbc, "ALTER TABLE ism ALTER COLUMN nome DROP NOT NULL");
            runSilently(jdbc, "ALTER TABLE ism ALTER COLUMN telefone DROP NOT NULL");
            runSilently(jdbc, "ALTER TABLE training_room ALTER COLUMN titulo DROP NOT NULL");
            runSilently(jdbc, "ALTER TABLE training_room ALTER COLUMN descricao DROP NOT NULL");

            // ── Colunas de tempo e datas na tabela user_trail_progress ───────────
            runSilently(jdbc, "ALTER TABLE user_trail_progress ADD COLUMN IF NOT EXISTS tempo_total_segundos bigint default 0");
            runSilently(jdbc, "ALTER TABLE user_trail_progress ADD COLUMN IF NOT EXISTS iniciado_em timestamp");
            runSilently(jdbc, "ALTER TABLE user_trail_progress ADD COLUMN IF NOT EXISTS concluido_em timestamp");

            // ── Nota obtida no quiz de certificação ───────────────────────────────
            runSilently(jdbc, "ALTER TABLE user_trail_progress ADD COLUMN IF NOT EXISTS nota_obtida double precision");

            // ── Tabela de gravações de vídeo ───────────────────────────────────────
            runSilently(jdbc, """
                CREATE TABLE IF NOT EXISTS video_recording (
                    id bigserial PRIMARY KEY,
                    training_room_id bigint REFERENCES training_room(id) ON DELETE CASCADE,
                    filename varchar(255) NOT NULL,
                    file_path varchar(500) NOT NULL,
                    file_size bigint,
                    duration_seconds bigint,
                    created_at timestamp NOT NULL DEFAULT now()
                )
            """);
            // Caso a tabela já existia com NOT NULL — torna nullable para gravações de cards
            runSilently(jdbc, "ALTER TABLE video_recording ALTER COLUMN training_room_id DROP NOT NULL");

            // ── Config de habilitação NPS por card/trilha ─────────────────────────
            runSilently(jdbc, """
                CREATE TABLE IF NOT EXISTS nps_config (
                    id bigserial PRIMARY KEY,
                    reference_type varchar(20) NOT NULL,
                    reference_id bigint NOT NULL,
                    enabled boolean NOT NULL DEFAULT true,
                    UNIQUE(reference_type, reference_id)
                )
            """);

            // ── Garantir que certified exista na tabela user_trail_progress ──────
            // Caso a tabela já existia sem a coluna (criada antes do campo ser adicionado)
            runSilently(jdbc, "ALTER TABLE user_trail_progress ADD COLUMN IF NOT EXISTS certified boolean default false");

            // ── Atualizar CHECK constraint de status para incluir CANCELADA ──────
            runSilently(jdbc, "ALTER TABLE training_room DROP CONSTRAINT IF EXISTS training_room_status_check");
            runSilently(jdbc, """
                ALTER TABLE training_room ADD CONSTRAINT training_room_status_check
                CHECK (status IN ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'))
            """);

            // ── Gerar jitsi_room_id para salas criadas antes desse campo existir ──
            // Usa md5(id + timestamp) para não depender da extensão pgcrypto
            runSilently(jdbc, """
                UPDATE training_room
                SET jitsi_room_id = 'udoc-' || left(md5(id::text || now()::text), 12)
                WHERE jitsi_room_id IS NULL OR jitsi_room_id = ''
            """);

            // ── Garantir que jitsi_room_id seja NOT NULL (pode estar nullable no schema) ──
            runSilently(jdbc, "ALTER TABLE training_room ALTER COLUMN jitsi_room_id DROP NOT NULL");

            // ── Configurações globais do sistema ───────────────────────────────
            runSilently(jdbc, """
                CREATE TABLE IF NOT EXISTS global_config (
                    chave varchar(100) PRIMARY KEY,
                    valor TEXT
                )
            """);
            // Limite padrão de armazenamento: 10 GB (só insere se não existir)
            runSilently(jdbc, """
                INSERT INTO global_config (chave, valor)
                VALUES ('storage_gravacoes_limite_bytes', '10737418240')
                ON CONFLICT (chave) DO NOTHING
            """);

            // ── Seed do usuário admin ──────────────────────────────────────────
            if (userRepository.existsByEmail("admin@udoc.com")) return;

            User admin = new User();
            admin.setName("Administrator");
            admin.setEmail("admin@udoc.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            userRepository.save(admin);

            System.out.println(">>> Admin user created: admin@udoc.com / admin123");
        };
    }

    private void runSilently(JdbcTemplate jdbc, String sql) {
        try {
            jdbc.execute(sql);
        } catch (Exception ignored) {
            // Coluna já foi removida ou não existe — sem problema
        }
    }
}
