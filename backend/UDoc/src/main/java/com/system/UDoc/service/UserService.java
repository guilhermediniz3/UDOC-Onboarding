package com.system.UDoc.service;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.Employee;
import com.system.UDoc.entity.User;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.EmployeeRepository;
import com.system.UDoc.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       EmployeeRepository employeeRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserDTO createUser(UserRequestDTO request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhoto(request.getPhoto());
        user.setRole(request.getRole());
        user.setActive(request.getActive());

        String pwd = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword() : "udoc@123";
        user.setPassword(passwordEncoder.encode(pwd));

        User saved = userRepository.save(user);
        return buildDTO(saved);
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(String search, Boolean active, Pageable pageable) {
        return userRepository.search(normalize(search), active, pageable)
                .map(this::buildDTO);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        return buildDTO(findById(id));
    }

    @Transactional
    public UserDTO updateUser(Long id, UserRequestDTO request) {
        User user = findById(id);

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already used by another user");

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhoto(request.getPhoto());
        user.setRole(request.getRole());
        user.setActive(request.getActive());

        User saved = userRepository.save(user);

        // ── Vínculo com Funcionário Externo ──────────────────────────────────
        // 1. Desvincula qualquer funcionário que já estava apontando para este usuário
        employeeRepository.findByUserId(saved.getId()).ifPresent(existing -> {
            if (request.getEmployeeId() == null || !existing.getId().equals(request.getEmployeeId())) {
                existing.setUser(null);
                employeeRepository.save(existing);
            }
        });

        // 2. Vincula o novo funcionário escolhido (se informado)
        if (request.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Employee not found with id " + request.getEmployeeId()));
            employee.setUser(saved);
            employeeRepository.save(employee);
        }

        return buildDTO(saved);
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordDTO dto) {
        if (!dto.getNewPassword().equals(dto.getConfirmPassword()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        User user = findById(id);
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id))
            throw new ResourceNotFoundException("User not found with id " + id);
        // Desvincula funcionário antes de deletar
        employeeRepository.findByUserId(id).ifPresent(e -> {
            e.setUser(null);
            employeeRepository.save(e);
        });
        userRepository.deleteById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private UserDTO buildDTO(User user) {
        UserDTO dto = new UserDTO(user);
        // Popula o funcionário externo vinculado, se existir
        employeeRepository.findByUserId(user.getId()).ifPresent(emp -> {
            dto.setEmployeeId(emp.getId());
            dto.setEmployeeName(emp.getName());
        });
        return dto;
    }

    private String normalize(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }
}
