package com.system.UDoc.service;

import com.system.UDoc.dto.TranscricaoTrechoDTO;
import com.system.UDoc.dto.TranscricaoTrechoRequestDTO;
import com.system.UDoc.entity.AuditLog;
import com.system.UDoc.entity.TranscricaoTrecho;
import com.system.UDoc.entity.User;
import com.system.UDoc.repository.AuditLogRepository;
import com.system.UDoc.repository.TranscricaoTrechoRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class TranscricaoService {

    @Value("${ai.whisper.model:whisper-large-v3-turbo}")
    private String whisperModel;

    private static final String GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

    private final TranscricaoTrechoRepository transcricaoRepository;
    private final AuditLogRepository auditLogRepository;
    private final RestTemplate restTemplate;
    private final AIService aiService;

    public TranscricaoService(
            TranscricaoTrechoRepository transcricaoRepository,
            AuditLogRepository auditLogRepository,
            RestTemplate restTemplate,
            AIService aiService) {
        this.transcricaoRepository = transcricaoRepository;
        this.auditLogRepository = auditLogRepository;
        this.restTemplate = restTemplate;
        this.aiService = aiService;
    }

    @Transactional
    public TranscricaoTrechoDTO salvarTrecho(TranscricaoTrechoRequestDTO req, User usuario) {
        TranscricaoTrecho trecho = new TranscricaoTrecho();
        trecho.setTrainingRoomId(req.getTrainingRoomId());
        trecho.setUsuarioId(usuario.getId());
        trecho.setSessaoId(req.getSessaoId());
        trecho.setTexto(req.getTexto());
        TranscricaoTrecho saved = transcricaoRepository.save(trecho);

        // Registra início de captura apenas no primeiro trecho da sessão
        boolean primeiro = req.getSessaoId() != null
                ? transcricaoRepository.countBySessaoId(req.getSessaoId()) == 1
                : transcricaoRepository.countByTrainingRoomId(req.getTrainingRoomId()) == 1;

        if (primeiro) {
            String target = req.getSessaoId() != null
                    ? "sessao#" + req.getSessaoId()
                    : "training-room#" + req.getTrainingRoomId();
            auditLogRepository.save(new AuditLog(
                    "TRANSCRICAO", "INICIAR_CAPTURA",
                    target,
                    usuario.getEmail(),
                    "Captura de transcrição iniciada"));
        }

        return new TranscricaoTrechoDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<TranscricaoTrechoDTO> listarPorSala(Long trainingRoomId) {
        return transcricaoRepository
                .findByTrainingRoomIdOrderByTimestampAsc(trainingRoomId)
                .stream()
                .map(TranscricaoTrechoDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TranscricaoTrechoDTO> listarPorSessao(Long sessaoId) {
        return transcricaoRepository
                .findBySessaoIdOrderByTimestampAsc(sessaoId)
                .stream()
                .map(TranscricaoTrechoDTO::new)
                .toList();
    }

    @Transactional
    public void registrarAcesso(Long sessaoId, Long ratId, String acao, User usuario) {
        String target = "sessao#" + sessaoId + (ratId != null ? "|rat#" + ratId : "");
        auditLogRepository.save(new AuditLog(
                "TRANSCRICAO", acao,
                target,
                usuario.getEmail(),
                "acao=" + acao + " | sessaoId=" + sessaoId));
    }

    @Transactional
    public TranscricaoTrechoDTO processarAudioChunk(Long trainingRoomId, Long sessaoId,
                                                     MultipartFile audio, User usuario) throws IOException {
        String texto = transcreverComWhisper(audio);
        if (texto == null || texto.isBlank()) return null;

        TranscricaoTrecho trecho = new TranscricaoTrecho();
        trecho.setTrainingRoomId(trainingRoomId);
        trecho.setUsuarioId(usuario.getId());
        trecho.setSessaoId(sessaoId);
        trecho.setTexto(texto.trim());
        TranscricaoTrecho saved = transcricaoRepository.save(trecho);
        return new TranscricaoTrechoDTO(saved);
    }

    @SuppressWarnings("unchecked")
    private String transcreverComWhisper(MultipartFile audio) throws IOException {
        // Usa a mesma cascata do AIService: usuário → empresa → config global → application.properties
        String groqKey = aiService.resolveGroqKey();
        if (groqKey == null || groqKey.isBlank()) return null;

        byte[] bytes = audio.getBytes();
        ByteArrayResource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() { return "audio.webm"; }
        };

        // Groq Whisper exige que o arquivo seja enviado com Content-Type correto.
        // Sem ele, a API pode rejeitar o arquivo ou inferir o formato incorretamente.
        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.valueOf("audio/webm"));

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new org.springframework.http.HttpEntity<>(resource, fileHeaders));
        body.add("model", whisperModel);
        body.add("language", "pt");
        body.add("response_format", "json");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(groqKey);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_WHISPER_URL, request, Map.class);
            if (response.getBody() != null) {
                Object text = response.getBody().get("text");
                return text != null ? text.toString() : null;
            }
        } catch (Exception e) {
            // silencia erros de transcrição (áudio curto, silêncio, falha de rede)
        }
        return null;
    }
}
