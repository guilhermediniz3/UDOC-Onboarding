package com.system.UDoc.controller;

import com.system.UDoc.dto.*;
import com.system.UDoc.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) { this.userService = userService; }

    @PostMapping public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserRequestDTO request) { return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request)); }
    @GetMapping public ResponseEntity<Page<UserDTO>> getAllUsers(@RequestParam(required = false) String search, @RequestParam(required = false) Boolean active, Pageable pageable) { return ResponseEntity.ok(userService.getAllUsers(search, active, pageable)); }
    @GetMapping("/{id}") public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) { return ResponseEntity.ok(userService.getUserById(id)); }
    @PutMapping("/{id}") public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @Valid @RequestBody UserRequestDTO request) { return ResponseEntity.ok(userService.updateUser(id, request)); }
    @PutMapping("/{id}/password") public ResponseEntity<Void> changePassword(@PathVariable Long id, @Valid @RequestBody ChangePasswordDTO dto) { userService.changePassword(id, dto); return ResponseEntity.noContent().build(); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> deleteUser(@PathVariable Long id) { userService.deleteUser(id); return ResponseEntity.noContent().build(); }
}
