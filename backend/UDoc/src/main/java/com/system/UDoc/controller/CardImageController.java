package com.system.UDoc.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/cards/images")
public class CardImageController {

    @Value("${app.upload.images.dir:uploads/images}")
    private String imageUploadDir;

    @Value("${app.backend-url}")
    private String backendUrl;

    private static final long MAX_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB

    @PostMapping(value = "/upload", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam("filename") String originalFilename,
            HttpServletRequest request
    ) throws IOException {

        String ext = resolveExtension(originalFilename);
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String safeName = "img_" + ts + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

        Path dir = Paths.get(imageUploadDir);
        Files.createDirectories(dir);

        Path dest = dir.resolve(safeName);
        long copied = Files.copy(request.getInputStream(), dest);

        if (copied > MAX_SIZE_BYTES) {
            Files.deleteIfExists(dest);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo excede o limite de 10 MB."));
        }

        String url = backendUrl + "/cards/images/" + safeName;
        return ResponseEntity.ok(Map.of("url", url, "filename", safeName));
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> serve(@PathVariable String filename) throws IOException {
        // Impede path traversal
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        Path file = Paths.get(imageUploadDir).resolve(filename);
        if (!Files.exists(file)) return ResponseEntity.notFound().build();

        String mediaType = resolveMediaType(filename);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mediaType))
                .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                .contentLength(Files.size(file))
                .body(new InputStreamResource(new FileInputStream(file.toFile())));
    }

    private String resolveExtension(String filename) {
        if (filename == null) return ".jpg";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png"))  return ".png";
        if (lower.endsWith(".gif"))  return ".gif";
        if (lower.endsWith(".webp")) return ".webp";
        if (lower.endsWith(".svg"))  return ".svg";
        return ".jpg";
    }

    private String resolveMediaType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".gif"))  return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg"))  return "image/svg+xml";
        return "image/jpeg";
    }
}
