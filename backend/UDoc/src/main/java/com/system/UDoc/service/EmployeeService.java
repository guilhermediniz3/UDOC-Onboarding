package com.system.UDoc.service;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.Company;
import com.system.UDoc.entity.Employee;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.CompanyRepository;
import com.system.UDoc.repository.EmployeeRepository;
import com.system.UDoc.repository.IsmRepository;
import com.system.UDoc.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final IsmRepository ismRepository;

    public EmployeeService(EmployeeRepository employeeRepository, CompanyRepository companyRepository,
                           UserRepository userRepository, IsmRepository ismRepository) {
        this.employeeRepository = employeeRepository;
        this.companyRepository  = companyRepository;
        this.userRepository     = userRepository;
        this.ismRepository      = ismRepository;
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeRequestDTO request) {
        Employee e = new Employee(); mapToEntity(request, e);
        return new EmployeeDTO(employeeRepository.save(e));
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDTO> getAllEmployees(String search, Boolean active, Pageable pageable) {
        return employeeRepository.search(normalize(search), active, pageable).map(EmployeeDTO::new);
    }

    private String normalize(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployeeById(Long id) { return new EmployeeDTO(findById(id)); }

    @Transactional
    public EmployeeDTO updateEmployee(Long id, EmployeeRequestDTO request) {
        Employee e = findById(id); mapToEntity(request, e);
        return new EmployeeDTO(employeeRepository.save(e));
    }

    @Transactional
    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) throw new ResourceNotFoundException("Employee not found with id " + id);
        employeeRepository.deleteById(id);
    }

    private Employee findById(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found with id " + id));
    }

    private void mapToEntity(EmployeeRequestDTO r, Employee e) {
        Company company = companyRepository.findById(r.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        e.setName(r.getName()); e.setPhone(r.getPhone()); e.setEmail(r.getEmail());
        e.setPhoto(r.getPhoto()); e.setCompany(company); e.setActive(r.getActive());
        e.setTipo(r.getTipo() != null ? r.getTipo() : (e.getTipo() != null ? e.getTipo() : "EXTERNO"));
        // ISM responsável e flag de chat (apenas para EXTERNO)
        if (r.getIsmId() != null) {
            ismRepository.findById(r.getIsmId()).ifPresent(e::setIsm);
        } else if (r.getIsmId() == null && "INTERNO".equals(e.getTipo())) {
            e.setIsm(null);
        }
        if (r.getChatIsmHabilitado() != null) e.setChatIsmHabilitado(r.getChatIsmHabilitado());
        e.setUser(r.getUserId() != null ? userRepository.findById(r.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + r.getUserId())) : null);
    }
}
