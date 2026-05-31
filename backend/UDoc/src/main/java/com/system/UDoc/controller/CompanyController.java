package com.system.UDoc.controller;

import com.system.UDoc.dto.*;
import com.system.UDoc.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/companies")
public class CompanyController {
    private final CompanyService companyService;
    public CompanyController(CompanyService companyService) { this.companyService = companyService; }

    @PostMapping public ResponseEntity<CompanyDTO> createCompany(@Valid @RequestBody CompanyRequestDTO request) { return ResponseEntity.status(HttpStatus.CREATED).body(companyService.createCompany(request)); }
    @GetMapping public ResponseEntity<Page<CompanyDTO>> getAllCompanies(@RequestParam(required = false) String search, @RequestParam(required = false) Boolean active, Pageable pageable) { return ResponseEntity.ok(companyService.getAllCompanies(search, active, pageable)); }
    @GetMapping("/{id}") public ResponseEntity<CompanyDTO> getCompanyById(@PathVariable Long id) { return ResponseEntity.ok(companyService.getCompanyById(id)); }
    @PutMapping("/{id}") public ResponseEntity<CompanyDTO> updateCompany(@PathVariable Long id, @Valid @RequestBody CompanyRequestDTO request) { return ResponseEntity.ok(companyService.updateCompany(id, request)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> deleteCompany(@PathVariable Long id) { companyService.deleteCompany(id); return ResponseEntity.noContent().build(); }
}
