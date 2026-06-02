package com.system.UDoc.controller;

import com.system.UDoc.dto.StorageInfoDTO;
import com.system.UDoc.dto.VideoRecordingDTO;
import com.system.UDoc.service.GlobalConfigService;
import com.system.UDoc.service.VideoRecordingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/config")
public class GlobalConfigController {

    private final GlobalConfigService configService;
    private final VideoRecordingService recordingService;

    public GlobalConfigController(GlobalConfigService configService,
                                  VideoRecordingService recordingService) {
        this.configService    = configService;
        this.recordingService = recordingService;
    }

    /** Informações de uso de armazenamento de gravações */
    @GetMapping("/storage")
    public ResponseEntity<StorageInfoDTO> getStorageInfo() {
        return ResponseEntity.ok(configService.getStorageInfo());
    }

    /** Define o limite de armazenamento */
    @PutMapping("/storage/limit")
    public ResponseEntity<StorageInfoDTO> setLimit(@RequestBody Map<String, Long> body) {
        long bytes = body.getOrDefault("limitBytes", GlobalConfigService.DEFAULT_STORAGE_LIMIT);
        configService.setStorageLimitBytes(bytes);
        return ResponseEntity.ok(configService.getStorageInfo());
    }

    /** Lista todas as gravações (para gestão de espaço) */
    @GetMapping("/recordings")
    public ResponseEntity<List<VideoRecordingDTO>> getAllRecordings() {
        return ResponseEntity.ok(recordingService.listAll());
    }
}
