package com.system.UDoc.service;

import com.system.UDoc.dto.IsmDTO;
import com.system.UDoc.dto.IsmRequestDTO;
import com.system.UDoc.entity.Ism;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.ChatConversaRepository;
import com.system.UDoc.repository.IsmRepository;
import com.system.UDoc.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IsmService {
    private final IsmRepository ismRepository;
    private final UserRepository userRepository;
    private final ChatConversaRepository chatConversaRepository;

    public IsmService(IsmRepository ismRepository, UserRepository userRepository,
                      ChatConversaRepository chatConversaRepository) {
        this.ismRepository = ismRepository;
        this.userRepository = userRepository;
        this.chatConversaRepository = chatConversaRepository;
    }

    @Transactional public IsmDTO createIsm(IsmRequestDTO request) { Ism ism = new Ism(); mapToEntity(request, ism); return new IsmDTO(ismRepository.save(ism)); }
    @Transactional(readOnly = true) public Page<IsmDTO> getAllIsms(String search, Boolean active, Pageable pageable) {
        // IsmRepository.search já exclui ISMs de sistema (sistema_ism=true) via query
        return ismRepository.search(normalize(search), active, pageable).map(IsmDTO::new);
    }
    private String normalize(String s) { return (s == null || s.isBlank()) ? null : s; }
    @Transactional(readOnly = true) public IsmDTO getIsmById(Long id) { return new IsmDTO(findById(id)); }
    @Transactional public IsmDTO updateIsm(Long id, IsmRequestDTO request) { Ism ism = findById(id); mapToEntity(request, ism); return new IsmDTO(ismRepository.save(ism)); }
    @Transactional
    public void deleteIsm(Long id) {
        if (!ismRepository.existsById(id))
            throw new ResourceNotFoundException("ISM not found with id " + id);
        // Desvincula conversas (ism_id é nullable — mantém o histórico do cliente)
        chatConversaRepository.clearIsmFromConversas(id);
        ismRepository.deleteById(id);
    }

    private Ism findById(Long id) { return ismRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("ISM not found with id " + id)); }

    private void mapToEntity(IsmRequestDTO r, Ism ism) {
        ism.setName(r.getName()); ism.setEmail(r.getEmail()); ism.setPhone(r.getPhone());
        ism.setPhoto(r.getPhoto()); ism.setActive(r.getActive());
        ism.setUser(r.getUserId() != null ? userRepository.findById(r.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + r.getUserId())) : null);
    }
}
