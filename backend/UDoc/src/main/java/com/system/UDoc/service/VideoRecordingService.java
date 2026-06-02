package com.system.UDoc.service;

import com.system.UDoc.dto.VideoRecordingDTO;
import com.system.UDoc.entity.TrainingRoom;
import com.system.UDoc.entity.VideoRecording;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.TrainingRoomRepository;
import com.system.UDoc.repository.VideoRecordingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class VideoRecordingService {

    private final VideoRecordingRepository repo;
    private final TrainingRoomRepository roomRepo;
    private final GlobalConfigService configService;

    @Value("${app.upload.dir:uploads/recordings}")
    private String uploadDir;

    public VideoRecordingService(VideoRecordingRepository repo,
                                 TrainingRoomRepository roomRepo,
                                 GlobalConfigService configService) {
        this.repo = repo;
        this.roomRepo = roomRepo;
        this.configService = configService;
    }

    @Transactional(readOnly = true)
    public List<VideoRecordingDTO> listAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream().map(VideoRecordingDTO::new).toList();
    }

    @Transactional
    public VideoRecordingDTO save(Long roomId, MultipartFile file, Long durationSeconds) throws IOException {
        TrainingRoom room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Training room not found"));

        // Garante o diretório de upload
        Path dir = Paths.get(uploadDir, String.valueOf(roomId));
        Files.createDirectories(dir);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "gravacao.webm";
        String timestamp = java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String safeExt  = originalName.endsWith(".mp4") ? ".mp4" : ".webm";
        String filename  = "gravacao_" + timestamp + safeExt;
        Path filePath    = dir.resolve(filename);

        file.transferTo(filePath.toFile());

        VideoRecording rec = new VideoRecording();
        rec.setTrainingRoom(room);
        rec.setFilename(filename);
        rec.setFilePath(filePath.toAbsolutePath().toString());
        rec.setFileSize(file.getSize());
        rec.setDurationSeconds(durationSeconds);

        return new VideoRecordingDTO(repo.save(rec));
    }

    @Transactional(readOnly = true)
    public List<VideoRecordingDTO> listByRoom(Long roomId) {
        return repo.findByTrainingRoomIdOrderByCreatedAtDesc(roomId)
                .stream().map(VideoRecordingDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> serveFile(Long recordingId) throws IOException {
        VideoRecording rec = repo.findById(recordingId)
                .orElseThrow(() -> new ResourceNotFoundException("Recording not found"));

        File file = new File(rec.getFilePath());
        if (!file.exists()) throw new ResourceNotFoundException("File not found on disk");

        String mediaType = rec.getFilename().endsWith(".mp4") ? "video/mp4" : "video/webm";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mediaType))
                .header("Content-Disposition", "inline; filename=\"" + rec.getFilename() + "\"")
                .contentLength(file.length())
                .body(new InputStreamResource(new FileInputStream(file)));
    }

    /** Upload binário direto — evita limitação do Tomcat maxPostSize (2MB) com multipart */
    @Transactional
    public VideoRecordingDTO saveBytes(Long roomId, InputStream stream, String filename,
                                       Long fileSize, Long durationSeconds) throws IOException {
        // Verifica cota antes de salvar
        configService.checkQuota();
        TrainingRoom room = roomId != null
                ? roomRepo.findById(roomId).orElse(null)
                : null;

        Path dir = Paths.get(uploadDir, roomId != null ? String.valueOf(roomId) : "generic");
        Files.createDirectories(dir);

        String safeExt   = filename.endsWith(".mp4") ? ".mp4" : ".webm";
        String timestamp = java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String safeName  = "gravacao_" + timestamp + safeExt;
        Path filePath    = dir.resolve(safeName);

        Files.copy(stream, filePath);

        VideoRecording rec = new VideoRecording();
        rec.setTrainingRoom(room);
        rec.setFilename(safeName);
        rec.setFilePath(filePath.toAbsolutePath().toString());
        rec.setFileSize(fileSize);
        rec.setDurationSeconds(durationSeconds);

        return new VideoRecordingDTO(repo.save(rec));
    }

    /** Upload genérico sem vínculo com sala — para gravações inseridas em cards */
    @Transactional
    public VideoRecordingDTO saveGeneric(MultipartFile file, Long durationSeconds) throws IOException {
        Path dir = Paths.get(uploadDir, "generic");
        Files.createDirectories(dir);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "gravacao.webm";
        String timestamp = java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String safeExt  = originalName.endsWith(".mp4") ? ".mp4" : ".webm";
        String filename  = "gravacao_" + timestamp + safeExt;
        Path filePath    = dir.resolve(filename);

        file.transferTo(filePath.toFile());

        VideoRecording rec = new VideoRecording();
        rec.setTrainingRoom(null);
        rec.setFilename(filename);
        rec.setFilePath(filePath.toAbsolutePath().toString());
        rec.setFileSize(file.getSize());
        rec.setDurationSeconds(durationSeconds);

        return new VideoRecordingDTO(repo.save(rec));
    }

    @Transactional
    public void delete(Long recordingId) {
        VideoRecording rec = repo.findById(recordingId)
                .orElseThrow(() -> new ResourceNotFoundException("Recording not found"));
        // Remove arquivo do disco
        try { new File(rec.getFilePath()).delete(); } catch (Exception ignored) {}
        repo.delete(rec);
    }
}
