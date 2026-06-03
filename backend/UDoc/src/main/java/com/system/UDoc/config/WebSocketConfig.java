package com.system.UDoc.config;

import com.system.UDoc.security.JwtUtil;
import com.system.UDoc.security.WebSocketAuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    public WebSocketConfig(JwtUtil jwtUtil,
                           org.springframework.security.core.userdetails.UserDetailsService userDetailsService) {
        this.jwtUtil             = jwtUtil;
        this.userDetailsService  = userDetailsService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Broker em memória para filas pessoais e tópicos
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefixo para mensagens enviadas ao servidor via @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
        // Prefixo para filas pessoais (/user/queue/...)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Valida JWT no CONNECT frame e popula o Principal
        registration.interceptors(new WebSocketAuthInterceptor(jwtUtil, userDetailsService));
    }
}
