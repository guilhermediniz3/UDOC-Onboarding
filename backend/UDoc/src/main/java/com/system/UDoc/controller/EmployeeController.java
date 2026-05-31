package com.system.UDoc.controller;

import com.system.UDoc.dto.*;
import com.system.UDoc.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/employees")
public class EmployeeController {
    private final EmployeeService employeeService;
    public EmployeeController(EmployeeService employeeService) { this.employeeService = employeeService; }

    @PostMapping public ResponseEntity<EmployeeDTO> createEmployee(@Valid @RequestBody EmployeeRequestDTO request) { return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(request)); }
    @GetMapping public ResponseEntity<Page<EmployeeDTO>> getAllEmployees(@RequestParam(required = false) String search, @RequestParam(required = false) Boolean active, Pageable pageable) { return ResponseEntity.ok(employeeService.getAllEmployees(search, active, pageable)); }
    @GetMapping("/{id}") public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable Long id) { return ResponseEntity.ok(employeeService.getEmployeeById(id)); }
    @PutMapping("/{id}") public ResponseEntity<EmployeeDTO> updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeRequestDTO request) { return ResponseEntity.ok(employeeService.updateEmployee(id, request)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) { employeeService.deleteEmployee(id); return ResponseEntity.noContent().build(); }
}
