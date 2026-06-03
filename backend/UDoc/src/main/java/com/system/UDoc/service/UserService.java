package com.system.UDoc.service;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.Employee;
import com.system.UDoc.entity.Ism;
import com.system.UDoc.entity.User;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.EmployeeRepository;
import com.system.UDoc.repository.IsmRepository;
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
    private final IsmRepository ismRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       EmployeeRepository employeeRepository,
                       IsmRepository ismRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository    = userRepository;
        this.employeeRepository = employeeRepository;
        this.ismRepository     = ismRepository;
        this.passwordEncoder   = passwordEncoder;
    }

    @Transactional
    public UserDTO createUser(UserRequestDTO request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");

        validateEmployeeRoleConsistency(request);

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

        // Vincula o funcionário escolhido (mesmo comportamento do updateUser)
        if (request.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Employee not found with id " + request.getEmployeeId()));
            employee.setUser(saved);
            employeeRepository.save(employee);
        }

        syncIsmRecord(saved, request.getEmployeeId());
        return buildDTO(saved);
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(String search, Boolean active, Pageable pageable) {
        return userRepository.search(normalize(search), active, pageable)
                .map(this::buildDTO);
    }

    @Transactional(readOnly = true)
    public java.util.List<UserDTO> getUsersByRole(com.system.UDoc.entity.Role role) {
        return userRepository.findByRoleAndActiveTrue(role)
                .stream().map(this::buildDTO).toList();
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

        validateEmployeeRoleConsistency(request);

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

        syncIsmRecord(saved, request.getEmployeeId());
        return buildDTO(saved);
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordDTO dto) {
        if (!dto.getNewPassword().equals(dto.getConfirmPassword()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        User user = findById(id);
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        user.setForcePasswordChange(false);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        // Soft delete tolerante: se o registro não existe no banco, trata como já deletado
        userRepository.findById(id).ifPresent(user -> {
            user.setActive(false);
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            // Desvincula o funcionário para evitar referências órfãs
            employeeRepository.findByUserId(id).ifPresent(e -> {
                e.setUser(null);
                employeeRepository.save(e);
            });
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private UserDTO buildDTO(User user) {
        UserDTO dto = new UserDTO(user);
        employeeRepository.findByUserId(user.getId()).ifPresent(emp -> {
            dto.setEmployeeId(emp.getId());
            dto.setEmployeeName(emp.getName());
            dto.setEmployeeTipo(emp.getTipo() != null ? emp.getTipo() : "EXTERNO");
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

    /**
     * Valida a consistência entre a role escolhida e o tipo do funcionário vinculado.
     * Regras:
     *   - EXTERNO → apenas FUNCIONARIO_EXTERNO
     *   - INTERNO → ISM ou FUNCIONARIO_EXTERNO (nunca ADMIN)
     *   - ADMIN   → sem vínculo obrigatório (validação de quem pode atribuir fica no controller)
     */
    /**
     * Quando um usuário tem role=ISM, garante que exista um registro na tabela `ism`
     * vinculado a ele. Se não existir, cria automaticamente usando os dados do User
     * (e do funcionário interno vinculado, se houver).
     * Isso permite que o ISM apareça no dropdown de "ISM Responsável" no cadastro
     * de funcionários externos.
     */
    private void syncIsmRecord(User user, Long employeeId) {
        if (user.getRole() != com.system.UDoc.entity.Role.ISM) return;
        if (ismRepository.findByUserId(user.getId()).isPresent()) return; // já existe

        Ism ism = new Ism();
        ism.setName(user.getName());
        ism.setEmail(user.getEmail());
        ism.setActive(true);
        ism.setUser(user);

        // Herda telefone e foto do funcionário interno, se vinculado
        if (employeeId != null) {
            employeeRepository.findById(employeeId).ifPresent(emp -> {
                ism.setPhone(emp.getPhone());
                ism.setPhoto(emp.getPhoto());
            });
        }

        ismRepository.save(ism);
    }

    private void validateEmployeeRoleConsistency(UserRequestDTO request) {
        if (request.getEmployeeId() == null) return; // Admin sem vínculo — OK

        Employee emp = employeeRepository.findById(request.getEmployeeId()).orElse(null);
        if (emp == null) return;

        String tipo = emp.getTipo() != null ? emp.getTipo() : "EXTERNO";

        if ("EXTERNO".equals(tipo) && request.getRole() != com.system.UDoc.entity.Role.FUNCIONARIO_EXTERNO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Funcionário Externo só pode ter o perfil Funcionário.");
        }
        if ("INTERNO".equals(tipo) && request.getRole() == com.system.UDoc.entity.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Funcionário Interno não pode ter o perfil Admin.");
        }
    }
}
