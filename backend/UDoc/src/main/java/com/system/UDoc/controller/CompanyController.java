package com.system.UDoc.controller;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.AIProvider;
import com.system.UDoc.entity.Company;
import com.system.UDoc.repository.CompanyRepository;
import com.system.UDoc.service.AIProviderKeyStore;
import com.system.UDoc.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/companies")
public class CompanyController {
    private final CompanyService companyService;
    private final CompanyRepository companyRepository;
    private final AIProviderKeyStore keyStore;

    public CompanyController(CompanyService companyService,
                             CompanyRepository companyRepository,
                             AIProviderKeyStore keyStore) {
        this.companyService    = companyService;
        this.companyRepository = companyRepository;
        this.keyStore          = keyStore;
    }

    @PostMapping public ResponseEntity<CompanyDTO> createCompany(@Valid @RequestBody CompanyRequestDTO request) { return ResponseEntity.status(HttpStatus.CREATED).body(companyService.createCompany(request)); }
    @GetMapping public ResponseEntity<Page<CompanyDTO>> getAllCompanies(@RequestParam(required = false) String search, @RequestParam(required = false) Boolean active, Pageable pageable) { return ResponseEntity.ok(companyService.getAllCompanies(search, active, pageable)); }
    @GetMapping("/{id}") public ResponseEntity<CompanyDTO> getCompanyById(@PathVariable Long id) { return ResponseEntity.ok(companyService.getCompanyById(id)); }
    @PutMapping("/{id}") public ResponseEntity<CompanyDTO> updateCompany(@PathVariable Long id, @Valid @RequestBody CompanyRequestDTO request) { return ResponseEntity.ok(companyService.updateCompany(id, request)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> deleteCompany(@PathVariable Long id) { companyService.deleteCompany(id); return ResponseEntity.noContent().build(); }

    /** Retorna o provedor ativo e as chaves por provedor (mascaradas) da empresa. */
    @GetMapping("/{id}/ai-providers")
    @PreAuthorize("hasAnyAuthority('ADMIN','GESTOR')")
    public ResponseEntity<Map<String, Object>> getCompanyAiProviders(@PathVariable Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa não encontrada."));
        Map<AIProvider, String> plain  = keyStore.readKeys(company.getAiProviderKeys());
        Map<AIProvider, String> masked = keyStore.maskAll(plain);
        Map<String, String> maskedStr = new LinkedHashMap<>();
        for (Map.Entry<AIProvider, String> e : masked.entrySet()) {
            maskedStr.put(e.getKey().name(), e.getValue());
        }
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("activeProvider", company.getAiActiveProvider());
        resp.put("providerKeys", maskedStr);
        return ResponseEntity.ok(resp);
    }

    /**
     * Salva o provedor ativo e as chaves por provedor da empresa.
     * Chaves mascaradas (contêm "...") são ignoradas — sem edição.
     * Chave vazia remove o provedor do mapa.
     */
    @PutMapping("/{id}/ai-providers")
    @PreAuthorize("hasAnyAuthority('ADMIN','GESTOR')")
    public ResponseEntity<Void> saveCompanyAiProviders(@PathVariable Long id,
                                                       @RequestBody Map<String, Object> body) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa não encontrada."));

        Object apRaw = body.get("activeProvider");
        if (apRaw != null) {
            company.setAiActiveProvider(apRaw.toString().isBlank() ? null : apRaw.toString());
        }

        @SuppressWarnings("unchecked")
        Map<String, String> keysRaw = (Map<String, String>) body.get("providerKeys");
        if (keysRaw != null) {
            Map<AIProvider, String> updates = new EnumMap<>(AIProvider.class);
            for (Map.Entry<String, String> entry : keysRaw.entrySet()) {
                AIProvider provider = AIProvider.fromString(entry.getKey());
                String val = entry.getValue();
                if (provider != null && (val == null || !val.contains("..."))) {
                    updates.put(provider, val != null ? val : "");
                }
            }
            company.setAiProviderKeys(keyStore.mergeAndWrite(company.getAiProviderKeys(), updates));
        }
        companyRepository.save(company);
        return ResponseEntity.noContent().build();
    }
}
