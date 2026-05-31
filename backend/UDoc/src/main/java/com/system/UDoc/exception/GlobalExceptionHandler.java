package com.system.UDoc.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.client.HttpClientErrorException;

import java.util.HashMap;
import java.util.List;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(
            ResourceNotFoundException exception,
            HttpServletRequest request) {

        Map<String, Object> error = new LinkedHashMap<>();

        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.NOT_FOUND.value());
        error.put("error", HttpStatus.NOT_FOUND.getReasonPhrase());
        error.put("message", exception.getMessage());
        error.put("path", request.getRequestURI());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {

        Map<String, Object> error = new LinkedHashMap<>();

        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
        error.put("error", "Validation Failed");

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }

        error.put("errors", fieldErrors);
        error.put("path", request.getRequestURI());

        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(
            BadCredentialsException exception,
            HttpServletRequest request) {

        Map<String, Object> error = new LinkedHashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.UNAUTHORIZED.value());
        error.put("error", "Unauthorized");
        error.put("message", "E-mail ou senha inválidos");
        error.put("path", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> handleDisabled(
            DisabledException exception,
            HttpServletRequest request) {

        Map<String, Object> error = new LinkedHashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.UNAUTHORIZED.value());
        error.put("error", "Unauthorized");
        error.put("message", "Usuário inativo");
        error.put("path", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            ResponseStatusException exception,
            HttpServletRequest request) {

        Map<String, Object> error = new LinkedHashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", exception.getStatusCode().value());
        error.put("error", exception.getReason());
        error.put("message", exception.getReason());
        error.put("path", request.getRequestURI());

        return ResponseEntity.status(exception.getStatusCode()).body(error);
    }

    /**
     * Captura erros de chamadas a APIs externas (ex: Groq) para evitar que
     * um 401 da API externa cause logout no frontend do UDoc.
     */
    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<Map<String, Object>> handleExternalApiError(
            HttpClientErrorException exception,
            HttpServletRequest request) {

        Map<String, Object> error = new LinkedHashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        error.put("error", "External API Error");
        error.put("message", "Erro ao chamar API externa (HTTP " + exception.getStatusCode().value() + "). Verifique as credenciais e configuracoes.");
        error.put("path", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }


    @ExceptionHandler(ScheduleConflictException.class)
    public ResponseEntity<Map<String, Object>> handleScheduleConflict(
            ScheduleConflictException exception,
            HttpServletRequest request) {

        Map<String, Object> error = new LinkedHashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.CONFLICT.value());
        error.put("error", "Schedule Conflict");
        error.put("message", "Conflito de horário detectado. Verifique os detalhes.");
        error.put("path", request.getRequestURI());

        List<Map<String, Object>> conflicts = new java.util.ArrayList<>();
        for (var c : exception.getConflicts()) {
            Map<String, Object> detail = new HashMap<>();
            detail.put("conflictType", c.conflictType());
            detail.put("entityName", c.entityName());
            detail.put("trainingRoomTitle", c.trainingRoomTitle());
            detail.put("date", c.date());
            detail.put("startTime", c.startTime());
            detail.put("endTime", c.endTime());
            conflicts.add(detail);
        }
        error.put("conflicts", conflicts);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(
            DataIntegrityViolationException exception,
            HttpServletRequest request) {

        Throwable cause = exception.getRootCause();
        String rootMsg = cause != null ? cause.getMessage() : exception.getMessage();
        String rootMsgLower = rootMsg != null ? rootMsg.toLowerCase() : "";

        String message;
        if (rootMsgLower.contains("unique") || rootMsgLower.contains("duplicate")) {
            message = "Registro duplicado — verifique campos únicos como e-mail ou CNPJ.";
        } else if (rootMsgLower.contains("not-null") || rootMsgLower.contains("nulo") || rootMsgLower.contains("null")) {
            message = "Campo obrigatório sem valor — verifique os dados enviados.";
        } else if (rootMsgLower.contains("foreign key") || rootMsgLower.contains("chave estrangeira")) {
            message = "Referência inválida — o registro relacionado não existe.";
        } else {
            message = "Violação de integridade de dados.";
        }

        Map<String, Object> error = new LinkedHashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.CONFLICT.value());
        error.put("error", "Data Integrity Violation");
        error.put("message", message);
        // Expõe a mensagem real do banco para facilitar diagnóstico
        error.put("detail", rootMsg);
        error.put("path", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(DuplicateSortOrderException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateSortOrderException(
            DuplicateSortOrderException exception,
            HttpServletRequest request) {

        Map<String, Object> error = new LinkedHashMap<>();

        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.CONFLICT.value());
        error.put("error", HttpStatus.CONFLICT.getReasonPhrase());
        error.put("message", exception.getMessage());
        error.put("path", request.getRequestURI());

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(error);
    }
}
