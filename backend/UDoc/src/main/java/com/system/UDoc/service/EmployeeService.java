package com.system.UDoc.service;

import com.system.UDoc.dto.*;
import com.system.UDoc.entity.Company;
import com.system.UDoc.entity.Employee;
import com.system.UDoc.exception.ResourceNotFoundException;
import com.system.UDoc.repository.CompanyRepository;
import com.system.UDoc.repository.EmployeeRepository;
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

    public EmployeeService(EmployeeRepository employeeRepository, CompanyRepository companyRepository, UserRepository userRepository) {
        this.employeeRepository = employeeRepository; this.companyRepository = companyRepository; this.userRepository = userRepository;
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeRequestDTO request) {
        Employee e = new Employee(); mapToEntity(request, e);
        return new EmployeeDTO(employeeRepository.save(e));
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDTO> getAllEmployees(String search, Boolean active, Pageable pageable) {
        return employeeRepository.search(search, active, pageable).map(EmployeeDTO::new);
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
        e.setUser(r.getUserId() != null ? userRepository.findById(r.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + r.getUserId())) : null);
    }
}
