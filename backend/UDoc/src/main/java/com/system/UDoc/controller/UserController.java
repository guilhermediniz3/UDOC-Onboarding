package com.system.UDoc.controller;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.Role;
import com.system.UDoc.entity.User;
import com.system.UDoc.service.AuthService;
import com.system.UDoc.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, @Lazy AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(
            @Valid @RequestBody UserRequestDTO request,
            @AuthenticationPrincipal User currentUser) {
        validateRoleAndEmployee(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @GetMapping public ResponseEntity<Page<UserDTO>> getAllUsers(@RequestParam(required = false) String search, @RequestParam(required = false) Boolean active, Pageable pageable) { return ResponseEntity.ok(userService.getAllUsers(search, active, pageable)); }
    @GetMapping("/{id}") public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) { return ResponseEntity.ok(userService.getUserById(id)); }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRequestDTO request,
            @AuthenticationPrincipal User currentUser) {
        validateRoleAndEmployee(request, currentUser);
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PutMapping("/{id}/password") public ResponseEntity<Void> changePassword(@PathVariable Long id, @Valid @RequestBody ChangePasswordDTO dto) { userService.changePassword(id, dto); return ResponseEntity.noContent().build(); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> deleteUser(@PathVariable Long id) { userService.deleteUser(id); return ResponseEntity.noContent().build(); }

    /**
     * Valida as regras de negócio de role × vínculo de funcionário:
     * - ADMIN: só outro admin pode criar/promover; sem vínculo obrigatório
     * - ISM / FUNCIONARIO_EXTERNO: vínculo com funcionário obrigatório
     */
    private void validateRoleAndEmployee(UserRequestDTO request, User currentUser) {
        // Somente admin pode definir role ADMIN
        if (request.getRole() == Role.ADMIN &&
                (currentUser == null || currentUser.getRole() != Role.ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Apenas administradores podem criar ou promover usuários com perfil Admin.");
        }
        // Roles não-Admin exigem vínculo com funcionário
        if (request.getRole() != Role.ADMIN && request.getEmployeeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Perfis Funcionário e ISM precisam ter um funcionário vinculado (Externo ou Interno).");
        }
    }

    @PostMapping("/{id}/send-welcome-email")
    public ResponseEntity<Void> sendWelcomeEmail(@PathVariable Long id) {
        authService.sendWelcomeEmail(id);
        return ResponseEntity.noContent().build();
    }

    /** Lista usuários com role=ISM para o select no cadastro de ISM */
    @GetMapping("/by-role/{role}")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getUsersByRole(
            @PathVariable String role) {
        try {
            com.system.UDoc.entity.Role r = com.system.UDoc.entity.Role.valueOf(role.toUpperCase());
            java.util.List<java.util.Map<String, Object>> result =
                userService.getUsersByRole(r).stream()
                    .map(u -> java.util.Map.<String, Object>of(
                        "id", u.getId(), "name", u.getName(), "email", u.getEmail()))
                    .toList();
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /** Gera link de convite sem enviar e-mail — admin envia pelo canal que preferir (ex: WhatsApp) */
    @PostMapping("/{id}/invite-link")
    public ResponseEntity<java.util.Map<String, String>> getInviteLink(@PathVariable Long id) {
        String link = authService.generateInviteLink(id);
        return ResponseEntity.ok(java.util.Map.of("link", link));
    }
}
