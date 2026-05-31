package com.system.UDoc.service;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.User;
import com.system.UDoc.exception.ResourceNotFoundException;
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
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository; this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserDTO createUser(UserRequestDTO request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        User user = new User();
        user.setName(request.getName()); user.setEmail(request.getEmail());
        user.setPhoto(request.getPhoto()); user.setRole(request.getRole()); user.setActive(request.getActive());
        String pwd = (request.getPassword() != null && !request.getPassword().isBlank()) ? request.getPassword() : "udoc@123";
        user.setPassword(passwordEncoder.encode(pwd));
        return new UserDTO(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(String search, Boolean active, Pageable pageable) {
        return userRepository.search(search, active, pageable).map(UserDTO::new);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) { return new UserDTO(findById(id)); }

    @Transactional
    public UserDTO updateUser(Long id, UserRequestDTO request) {
        User user = findById(id);
        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already used by another user");
        user.setName(request.getName()); user.setEmail(request.getEmail());
        user.setPhoto(request.getPhoto()); user.setRole(request.getRole()); user.setActive(request.getActive());
        return new UserDTO(userRepository.save(user));
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
        if (!userRepository.existsById(id)) throw new ResourceNotFoundException("User not found with id " + id);
        userRepository.deleteById(id);
    }

    private User findById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }
}
