package com.system.UDoc.config;

import com.system.UDoc.entity.Role;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    @Order(1)
    public CommandLineRunner seedAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbc
    ) {
        return args -> {

            // ── Tipo de funcionário (EXTERNO=clientes / INTERNO=equipe própria) ─
            runSilently(jdbc, "ALTER TABLE employee ADD COLUMN IF NOT EXISTS tipo varchar(20) DEFAULT 'EXTERNO'");
            runSilently(jdbc, "UPDATE employee SET tipo = 'EXTERNO' WHERE tipo IS NULL");

            // ════════════════════════════════════════════════════════════════════
            // ── CHAT ─────────────────────────────────────────────────────────────
            // ════════════════════════════════════════════════════════════════════

            // pg_trgm para busca semântica de cards
            runSilently(jdbc, "CREATE EXTENSION IF NOT EXISTS pg_trgm");

            // Índice GIN para busca de cards por title e description
            runSilently(jdbc, """
                CREATE INDEX IF NOT EXISTS idx_card_trgm
                ON card USING GIN ((title || ' ' || COALESCE(description, '')) gin_trgm_ops)
            """);

            // Campos de chat no employee (funcionário externo)
            runSilently(jdbc, "ALTER TABLE employee ADD COLUMN IF NOT EXISTS ism_id bigint REFERENCES ism(id)");
            runSilently(jdbc, "ALTER TABLE employee ADD COLUMN IF NOT EXISTS chat_ism_habilitado boolean NOT NULL DEFAULT true");

            // Config global: chat habilitado por padrão
            runSilently(jdbc, """
                INSERT INTO global_config (chave, valor)
                VALUES ('chat_habilitado', 'true')
                ON CONFLICT (chave) DO NOTHING
            """);

            // Tabela de conversas
            runSilently(jdbc, """
                CREATE TABLE IF NOT EXISTS chat_conversa (
                    id bigserial PRIMARY KEY,
                    cliente_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    ism_id bigint REFERENCES ism(id),
                    status varchar(20) NOT NULL DEFAULT 'ABERTA',
                    criada_em timestamp NOT NULL DEFAULT now(),
                    encerrada_em timestamp
                )
            """);

            // Tabela de mensagens
            runSilently(jdbc, """
                CREATE TABLE IF NOT EXISTS chat_mensagem (
                    id bigserial PRIMARY KEY,
                    conversa_id bigint NOT NULL REFERENCES chat_conversa(id) ON DELETE CASCADE,
                    conteudo TEXT NOT NULL,
                    tipo varchar(20) NOT NULL,
                    lida boolean NOT NULL DEFAULT false,
                    data_hora timestamp NOT NULL DEFAULT now()
                )
            """);
            runSilently(jdbc, "CREATE INDEX IF NOT EXISTS idx_chat_msg_conversa ON chat_mensagem(conversa_id)");

            // Tabela de avaliações (nota 1-4 igual ao NPS)
            runSilently(jdbc, """
                CREATE TABLE IF NOT EXISTS chat_avaliacao (
                    id bigserial PRIMARY KEY,
                    conversa_id bigint NOT NULL REFERENCES chat_conversa(id) ON DELETE CASCADE,
                    nota integer NOT NULL CHECK (nota BETWEEN 1 AND 4),
                    tipo varchar(10) NOT NULL CHECK (tipo IN ('IA','ISM')),
                    criada_em timestamp NOT NULL DEFAULT now()
                )
            """);

            // ── Card interno: visível apenas para funcionários internos/admins ──
            runSilently(jdbc, "ALTER TABLE card ADD COLUMN IF NOT EXISTS interno boolean NOT NULL DEFAULT false");

            // ── Limpa referências de user_id órfãs na tabela employee ──────────
            // Ocorre quando um usuário é deletado diretamente do banco (hard delete)
            // sem passar pelo soft delete, deixando funcionários com user_id inválido
            runSilently(jdbc, """
                UPDATE employee
                SET user_id = NULL
                WHERE user_id IS NOT NULL
                  AND user_id NOT IN (SELECT id FROM users)
            """);

            // ── Company: headquarters opcional e logo ──────────────────────────
            runSilently(jdbc, "ALTER TABLE company ALTER COLUMN headquarters DROP NOT NULL");
            runSilently(jdbc, "ALTER TABLE company ADD COLUMN IF NOT EXISTS logo TEXT");

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

            // ── Tabela de auditoria de configurações ──────────────────────────────
            runSilently(jdbc, """
                CREATE TABLE IF NOT EXISTS audit_log (
                    id bigserial PRIMARY KEY,
                    action varchar(100) NOT NULL,
                    target varchar(100) NOT NULL,
                    performed_by varchar(255),
                    timestamp timestamp NOT NULL DEFAULT now(),
                    details TEXT
                )
            """);

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

            // ── Módulo no audit_log para categorização por área do sistema ────
            runSilently(jdbc, "ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS module varchar(100)");

            // ── Coluna de troca de senha obrigatória ───────────────────────────
            runSilently(jdbc, "ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change boolean NOT NULL DEFAULT false");

            // ── Auto-vincula ISM.user_id ao User correspondente pelo email ────
            runSilently(jdbc, """
                UPDATE ism i
                SET user_id = u.id
                FROM users u
                WHERE i.user_id IS NULL
                  AND i.email IS NOT NULL
                  AND LOWER(i.email) = LOWER(u.email)
                  AND u.role = 'ISM'
            """);

            // ── Vincula chat_conversa.ism_id a partir do employee do cliente ──
            // Cobre conversas criadas antes do ISM ser atribuído ao funcionário,
            // ou criadas antes desta lógica existir no código.
            runSilently(jdbc, """
                UPDATE chat_conversa cc
                SET ism_id = emp.ism_id
                FROM employee emp
                WHERE cc.cliente_id = emp.user_id
                  AND cc.ism_id IS NULL
                  AND cc.status = 'ABERTA'
                  AND emp.ism_id IS NOT NULL
            """);

            // Seed do usuário padrão movido para DataSeeder (ApplicationRunner @Order(2))
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
