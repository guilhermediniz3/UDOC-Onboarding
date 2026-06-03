package com.system.UDoc.service;

import com.system.UDoc.entity.Notification;
import com.system.UDoc.entity.Notification.NotifType;
import com.system.UDoc.entity.Notification.RefType;
import com.system.UDoc.entity.Role;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.NotificationRepository;
import com.system.UDoc.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notifRepo;
    private final UserRepository         userRepo;

    public NotificationService(NotificationRepository notifRepo, UserRepository userRepo) {
        this.notifRepo = notifRepo;
        this.userRepo  = userRepo;
    }

    /**
     * Gera notificação para todos os usuários elegíveis.
     * Regra 7.4:
     *   ADMIN / ISM / INTERNO → recebe tudo
     *   EXTERNO → recebe apenas cards com interno=false (e trilhas normalmente)
     */
    @Transactional
    public void notify(NotifType type, String title, Long referenceId, boolean isInternalCard) {
        String by = resolveCurrentUser();
        RefType refType = (type == NotifType.CARD_CREATED || type == NotifType.CARD_UPDATED)
                          ? RefType.CARD : RefType.TRAIL;

        List<User> targets = userRepo.findAll().stream()
            .filter(User::isEnabled)
            .filter(u -> {
                // EXTERNO não recebe notificação de cards internos
                if (isInternalCard && u.getRole() == Role.FUNCIONARIO_EXTERNO) return false;
                return true;
            })
            .toList();

        List<Notification> notifications = targets.stream()
            .map(u -> new Notification(u.getId(), type, title, referenceId, refType, by))
            .toList();

        notifRepo.saveAll(notifications);
    }

    // ── Consulta ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<Notification> getForUser(Long userId, Pageable pageable) {
        return notifRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notifRepo.countByUserIdAndReadFalse(userId);
    }

    // ── Marcar lidas ─────────────────────────────────────────────────────────

    @Transactional
    public void markRead(Long notifId, Long userId) {
        notifRepo.findById(notifId).ifPresent(n -> {
            if (n.getUserId().equals(userId)) n.setRead(true);
        });
    }

    @Transactional
    public void markAllRead(Long userId) {
        notifRepo.markAllReadByUser(userId);
    }

    private String resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "system";
    }
}
