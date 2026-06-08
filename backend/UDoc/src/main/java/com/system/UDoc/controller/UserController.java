package com.system.UDoc.controller;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.AIProvider;
import com.system.UDoc.entity.PermissionGroup.GroupType;
import com.system.UDoc.entity.Role;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.UserRepository;
import com.system.UDoc.service.AIProviderKeyStore;
import com.system.UDoc.service.AIService;
import com.system.UDoc.service.AuthService;
import com.system.UDoc.service.EncryptionService;
import com.system.UDoc.service.PermissionService;
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
    private final PermissionService permissionService;
    private final UserRepository userRepository;
    private final EncryptionService encryptionService;
    private final AIProviderKeyStore keyStore;
    private final AIService aiService;

    public UserController(UserService userService, @Lazy AuthService authService,
                           PermissionService permissionService, UserRepository userRepository,
                           EncryptionService encryptionService, AIProviderKeyStore keyStore,
                           AIService aiService) {
        this.userService = userService;
        this.authService = authService;
        this.permissionService = permissionService;
        this.userRepository = userRepository;
        this.encryptionService = encryptionService;
        this.keyStore = keyStore;
        this.aiService = aiService;
    }

    /** Retorna o displayName do provedor de IA efetivo (cascata usuário → empresa → global → default). */
    @GetMapping("/me/ai-provider/active")
    public ResponseEntity<java.util.Map<String, String>> getActiveAIProvider() {
        String displayName = aiService.resolveCurrentProviderDisplayName();
        return ResponseEntity.ok(java.util.Map.of("displayName", displayName));
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(
            @Valid @RequestBody UserRequestDTO request,
            @AuthenticationPrincipal User currentUser) {
        validateRoleAndEmployee(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @GetMapping
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String company,
            Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(search, active, tipo, company, pageable));
    }
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
        // Somente admin pode definir role ADMIN ou GESTOR
        if ((request.getRole() == Role.ADMIN || request.getRole() == Role.GESTOR) &&
                (currentUser == null || currentUser.getRole() != Role.ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Apenas administradores podem criar ou promover usuários com perfil Admin ou Gestor.");
        }
        // Roles não-Admin/Gestor exigem vínculo com funcionário
        if (request.getRole() != Role.ADMIN && request.getRole() != Role.GESTOR && request.getEmployeeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Perfis Funcionário e ISM precisam ter um funcionário vinculado (Externo ou Interno).");
        }
    }

    @PostMapping("/{id}/send-welcome-email")
    public ResponseEntity<Void> sendWelcomeEmail(@PathVariable Long id) {
        requireSendInvitePermission();
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
        requireSendInvitePermission();
        String link = authService.generateInviteLink(id);
        return ResponseEntity.ok(java.util.Map.of("link", link));
    }

    /** Bloqueia o envio do convite (e-mail/WhatsApp) para grupos sem a permissão USUARIO/ENVIAR_CONVITE. ADMIN bypassa. */
    private void requireSendInvitePermission() {
        GroupType groupType = permissionService.resolveCurrentUserGroup();
        if (groupType == null) return; // ADMIN bypassa

        if (!permissionService.hasPermission(groupType, "USUARIO", "ENVIAR_CONVITE")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você não tem permissão para enviar o link de redefinição de senha.");
        }
    }

    /**
     * Chave pessoal de IA do próprio usuário (economiza tokens da chave geral).
     * Estritamente self-only: resolvido via @AuthenticationPrincipal, sem {id} — não pode ser
     * usado para ler/alterar a chave de outro usuário, independentemente de rotas/guards do front.
     * @deprecated Use /me/ai-providers
     */
    @GetMapping("/me/ai-key")
    public ResponseEntity<java.util.Map<String, String>> getMyAiKey(@AuthenticationPrincipal User currentUser) {
        String encrypted = currentUser.getAiApiKey();
        String masked = (encrypted == null || encrypted.isBlank())
                ? null
                : maskKey(encryptionService.decrypt(encrypted));
        java.util.Map<String, String> body = new java.util.HashMap<>();
        body.put("aiApiKey", masked);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/me/ai-key")
    public ResponseEntity<Void> saveMyAiKey(@AuthenticationPrincipal User currentUser,
                                            @RequestBody java.util.Map<String, String> body) {
        String value = body.get("aiApiKey");
        if (value != null && value.contains("...")) {
            return ResponseEntity.noContent().build();
        }
        User managed = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
        if (value == null || value.isBlank()) {
            managed.setAiApiKey(null);
        } else {
            managed.setAiApiKey(encryptionService.encrypt(value.trim()));
        }
        userRepository.save(managed);
        return ResponseEntity.noContent().build();
    }

    /** Retorna o provedor ativo e as chaves por provedor (mascaradas) do próprio usuário. */
    @GetMapping("/me/ai-providers")
    public ResponseEntity<java.util.Map<String, Object>> getMyAiProviders(@AuthenticationPrincipal User currentUser) {
        java.util.Map<AIProvider, String> plain  = keyStore.readKeys(currentUser.getAiProviderKeys());
        java.util.Map<AIProvider, String> masked  = keyStore.maskAll(plain);
        java.util.Map<String, String> maskedStr = new java.util.LinkedHashMap<>();
        for (java.util.Map.Entry<AIProvider, String> e : masked.entrySet()) {
            maskedStr.put(e.getKey().name(), e.getValue());
        }
        java.util.Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("activeProvider", currentUser.getAiActiveProvider());
        resp.put("providerKeys", maskedStr);
        return ResponseEntity.ok(resp);
    }

    /**
     * Salva o provedor ativo e as chaves por provedor do próprio usuário.
     * Chaves que contêm "..." são ignoradas (valor mascarado, sem edição).
     * Chave vazia remove o provedor do mapa.
     */
    @PutMapping("/me/ai-providers")
    public ResponseEntity<Void> saveMyAiProviders(@AuthenticationPrincipal User currentUser,
                                                  @RequestBody java.util.Map<String, Object> body) {
        User managed = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        if (body.containsKey("activeProvider")) {
            Object apRaw = body.get("activeProvider");
            String ap = (apRaw != null) ? apRaw.toString().trim() : "";
            managed.setAiActiveProvider(ap.isBlank() ? null : ap);
        }

        @SuppressWarnings("unchecked")
        java.util.Map<String, String> keysRaw = (java.util.Map<String, String>) body.get("providerKeys");
        if (keysRaw != null) {
            java.util.Map<AIProvider, String> updates = new java.util.EnumMap<>(AIProvider.class);
            for (java.util.Map.Entry<String, String> entry : keysRaw.entrySet()) {
                AIProvider provider = AIProvider.fromString(entry.getKey());
                String val = entry.getValue();
                if (provider != null && (val == null || !val.contains("..."))) {
                    updates.put(provider, val != null ? val : "");
                }
            }
            managed.setAiProviderKeys(keyStore.mergeAndWrite(managed.getAiProviderKeys(), updates));
        }
        userRepository.save(managed);
        return ResponseEntity.noContent().build();
    }

    private String maskKey(String plainValue) {
        if (plainValue == null || plainValue.isBlank()) return null;
        int len = plainValue.length();
        if (len <= 8) return "***";
        int prefixLen = Math.min(6, len - 4);
        return plainValue.substring(0, prefixLen) + "..." + plainValue.substring(len - 4);
    }
}
