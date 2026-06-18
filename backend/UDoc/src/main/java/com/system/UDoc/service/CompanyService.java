package com.system.UDoc.service;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.Company;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.CompanyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CompanyService {
    private final CompanyRepository companyRepository;
    public CompanyService(CompanyRepository companyRepository) { this.companyRepository = companyRepository; }

    @Transactional
    public CompanyDTO createCompany(CompanyRequestDTO request) {
        if (companyRepository.existsByCnpj(request.getCnpj()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CNPJ already registered");
        Company c = new Company();
        mapToEntity(request, c);
        return new CompanyDTO(companyRepository.save(c));
    }

    @Transactional(readOnly = true)
    public Page<CompanyDTO> getAllCompanies(String search, Boolean active, Pageable pageable) {
        return companyRepository.search(normalize(search), normalizeDigits(search), active, pageable).map(CompanyDTO::new);
    }

    private String normalize(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private String normalizeDigits(String s) {
        if (s == null || s.isBlank()) return null;
        String digits = s.replaceAll("[^0-9]", "");
        return digits.isEmpty() ? null : digits;
    }

    @Transactional(readOnly = true)
    public CompanyDTO getCompanyById(Long id) { return new CompanyDTO(findById(id)); }

    @Transactional
    public CompanyDTO updateCompany(Long id, CompanyRequestDTO request) {
        Company c = findById(id);
        if (companyRepository.existsByCnpjAndIdNot(request.getCnpj(), id))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CNPJ already used by another company");
        mapToEntity(request, c);
        return new CompanyDTO(companyRepository.save(c));
    }

    @Transactional
    public void deleteCompany(Long id) {
        if (!companyRepository.existsById(id)) throw new ResourceNotFoundException("Company not found with id " + id);
        companyRepository.deleteById(id);
    }

    private Company findById(Long id) {
        return companyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Company not found with id " + id));
    }

    private void mapToEntity(CompanyRequestDTO r, Company c) {
        c.setHeadquarters(r.getHeadquarters()); c.setName(r.getName()); c.setPhone(r.getPhone());
        c.setCnpj(r.getCnpj()); c.setEmail(r.getEmail());
        c.setEmployeeCount(r.getEmployeeCount()); c.setActive(r.getActive());
        c.setLogo(r.getLogo());
    }
}
