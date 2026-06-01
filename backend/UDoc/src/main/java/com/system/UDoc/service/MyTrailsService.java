package com.system.UDoc.service;

import com.system.UDoc.dto.MyTrailContentItemDTO;
import com.system.UDoc.dto.TrailDTO;
import com.system.UDoc.entity.TrailContent;
import com.system.UDoc.entity.TrainingRoom;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MyTrailsService {

    private final EmployeeRepository employeeRepository;
    private final TrainingRoomRepository trainingRoomRepository;
    private final TrailRepository trailRepository;
    private final TrailContentRepository trailContentRepository;
    private final CardRepository cardRepository;

    public MyTrailsService(EmployeeRepository employeeRepository,
                           TrainingRoomRepository trainingRoomRepository,
                           TrailRepository trailRepository,
                           TrailContentRepository trailContentRepository,
                           CardRepository cardRepository) {
        this.employeeRepository = employeeRepository;
        this.trainingRoomRepository = trainingRoomRepository;
        this.trailRepository = trailRepository;
        this.trailContentRepository = trailContentRepository;
        this.cardRepository = cardRepository;
    }

    /** Retorna as trilhas em que o usuario (via funcionario externo) esta matriculado */
    @Transactional(readOnly = true)
    public List<TrailDTO> getMyTrails(Long userId) {
        var employee = employeeRepository.findByUserId(userId);
        if (employee.isEmpty()) return List.of();

        List<TrainingRoom> rooms = trainingRoomRepository.findByInvitedEmployeeId(employee.get().getId());

        // Deduplica trilhas e retorna na ordem da trilha
        return rooms.stream()
                .map(TrainingRoom::getTrail)
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(t -> t.getId(), t -> t, (a, b) -> a, LinkedHashMap::new))
                .values().stream()
                .sorted(Comparator.comparingInt(t -> t.getSortOrder()))
                .map(TrailDTO::new)
                .toList();
    }

    /** Retorna o conteudo ordenado de uma trilha para o visualizador */
    @Transactional(readOnly = true)
    public List<MyTrailContentItemDTO> getTrailContent(Long userId, Long trailId) {
        // Verifica acesso
        var employee = employeeRepository.findByUserId(userId);
        if (employee.isPresent()) {
            boolean hasAccess = trainingRoomRepository
                    .findByInvitedEmployeeId(employee.get().getId())
                    .stream()
                    .anyMatch(r -> r.getTrail() != null && r.getTrail().getId().equals(trailId));
            if (!hasAccess) throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Access denied to this trail");
        }

        var trail = trailRepository.findById(trailId)
                .orElseThrow(() -> new ResourceNotFoundException("Trail not found with id " + trailId));

        // 1. Busca conteudo ordenado da aba Conteudo (trail_content)
        List<TrailContent> contents = trailContentRepository.findByTrailIdOrderByOrdemAsc(trailId);

        if (!contents.isEmpty()) {
            return contents.stream().map(c -> buildItem(c)).filter(Objects::nonNull).toList();
        }

        // 2. Fallback: cards vinculados diretamente a trilha (ManyToMany antigo)
        return trail.getCards().stream().map(card -> {
            var dto = new MyTrailContentItemDTO();
            dto.setOrdem(trail.getCards().indexOf(card));
            dto.setTipo("card");
            dto.setCardId(card.getId());
            dto.setCardTitle(card.getTitle());
            dto.setCardDescription(card.getDescription());
            dto.setCardIcon(card.getIcon());
            dto.setCardContent(card.getContent());
            return dto;
        }).toList();
    }

    private MyTrailContentItemDTO buildItem(TrailContent c) {
        var dto = new MyTrailContentItemDTO();
        dto.setOrdem(c.getOrdem());
        dto.setTipo(c.getTipo());

        if ("card".equals(c.getTipo())) {
            return cardRepository.findById(c.getReferenciaId()).map(card -> {
                dto.setCardId(card.getId());
                dto.setCardTitle(card.getTitle());
                dto.setCardDescription(card.getDescription());
                dto.setCardIcon(card.getIcon());
                dto.setCardContent(card.getContent());
                return dto;
            }).orElse(null);
        }

        if ("sala".equals(c.getTipo())) {
            var room = trainingRoomRepository.findById(c.getReferenciaId());
            return room.map(r -> {
                dto.setSalaId(r.getId());
                dto.setSalaTitle(r.getTitle());
                dto.setVimeoUrl(r.getVimeoUrl());
                dto.setYoutubeUrl(r.getYoutubeUrl());
                return dto;
            }).orElse(null);
        }

        return null;
    }
}
