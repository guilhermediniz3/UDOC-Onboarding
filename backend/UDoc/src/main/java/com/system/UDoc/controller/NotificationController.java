package com.system.UDoc.controller;

import com.system.UDoc.entity.Notification;
import com.system.UDoc.entity.User;
import com.system.UDoc.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notifService;

    public NotificationController(NotificationService notifService) {
        this.notifService = notifService;
    }

    /** Lista notificações do usuário logado (paginado) */
    @GetMapping
    public ResponseEntity<Page<Notification>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(notifService.getForUser(
                user.getId(), PageRequest.of(page, size)));
    }

    /** Contador de não lidas */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("total", notifService.countUnread(user.getId())));
    }

    /** Marcar uma notificação como lida */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        notifService.markRead(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    /** Marcar todas como lidas */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal User user) {
        notifService.markAllRead(user.getId());
        return ResponseEntity.noContent().build();
    }
}
