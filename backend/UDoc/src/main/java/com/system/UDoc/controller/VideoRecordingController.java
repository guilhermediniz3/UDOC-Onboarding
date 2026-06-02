package com.system.UDoc.controller;

import com.system.UDoc.dto.VideoRecordingDTO;
import com.system.UDoc.service.VideoRecordingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/training-rooms")
public class VideoRecordingController {

    private final VideoRecordingService service;

    public VideoRecordingController(VideoRecordingService service) {
        this.service = service;
    }

    /**
     * Upload binário direto (application/octet-stream) — contorna o limite de 2MB do
     * Tomcat maxPostSize que afeta multipart e resultava em 401 antes do JWT processar.
     */
    @PostMapping(value = "/{roomId}/recordings", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<VideoRecordingDTO> uploadBinary(
            @PathVariable Long roomId,
            @RequestParam(value = "durationSeconds", defaultValue = "0") Long durationSeconds,
            @RequestParam(value = "filename", defaultValue = "gravacao.webm") String filename,
            HttpServletRequest request
    ) throws IOException {
        long contentLength = request.getContentLengthLong();
        return ResponseEntity.ok(service.saveBytes(roomId, request.getInputStream(),
                filename, contentLength > 0 ? contentLength : null, durationSeconds));
    }

    /** Endpoint genérico (sem sala) em binário — para cards */
    @PostMapping(value = "/recordings/upload", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<VideoRecordingDTO> uploadBinaryGeneric(
            @RequestParam(value = "durationSeconds", defaultValue = "0") Long durationSeconds,
            @RequestParam(value = "filename", defaultValue = "gravacao.webm") String filename,
            HttpServletRequest request
    ) throws IOException {
        long contentLength = request.getContentLengthLong();
        return ResponseEntity.ok(service.saveBytes(null, request.getInputStream(),
                filename, contentLength > 0 ? contentLength : null, durationSeconds));
    }

    @GetMapping("/{roomId}/recordings")
    public ResponseEntity<List<VideoRecordingDTO>> list(@PathVariable Long roomId) {
        return ResponseEntity.ok(service.listByRoom(roomId));
    }

    /** Upload genérico (card recording) — sem vínculo com sala */
    @PostMapping("/recordings/upload")
    public ResponseEntity<VideoRecordingDTO> uploadGeneric(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "durationSeconds", required = false, defaultValue = "0") Long durationSeconds
    ) throws IOException {
        return ResponseEntity.ok(service.saveGeneric(file, durationSeconds));
    }

    @GetMapping("/recordings/{recordingId}/file")
    public ResponseEntity<Resource> serveFile(@PathVariable Long recordingId) throws IOException {
        return service.serveFile(recordingId);
    }

    @DeleteMapping("/recordings/{recordingId}")
    public ResponseEntity<Void> delete(@PathVariable Long recordingId) {
        service.delete(recordingId);
        return ResponseEntity.noContent().build();
    }
}
