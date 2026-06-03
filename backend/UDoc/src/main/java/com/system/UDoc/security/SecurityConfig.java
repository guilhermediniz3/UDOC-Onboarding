package com.system.UDoc.security;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(ex -> ex
                        // 401 para requisições sem token / token inválido
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write(
                                    "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Token ausente ou inválido\"}"
                            );
                        })
                        // 403 para token válido mas sem permissão (quando houver controle por role)
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write(
                                    "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Acesso negado\"}"
                            );
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // WebSocket handshake (SockJS + STOMP)
                        .requestMatchers("/ws/**").permitAll()
                        // Rotas públicas
                        .requestMatchers("/auth/**").permitAll()
                        // Swagger (acesso em dev)
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        // OPTIONS liberado globalmente (preflight CORS)
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        // Cards públicos (listagem filtrada para usuários externos)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/cards/public").authenticated()
                        // NPS: respostas e contador de acesso são anônimos (sem login)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/nps/responses").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/nps/cards/*/access").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/nps/*/*/questions").permitAll()
                        // Streaming de gravações de vídeo — o <video> tag não envia Authorization header
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/training-rooms/recordings/*/file").permitAll()
                        // Módulo de Auditoria — restrito a ADMIN
                        .requestMatchers("/auditoria/**").hasAuthority("ADMIN")
                        // Leitura das minhas permissões — qualquer autenticado; PUT só admin via @PreAuthorize
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/permissions/my").authenticated()
                        // Todo o resto exige autenticação
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}
