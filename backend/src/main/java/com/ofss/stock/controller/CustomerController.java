package com.ofss.stock.controller;

import com.ofss.stock.dto.CustomerRequest;
import com.ofss.stock.dto.CustomerResponse;
import com.ofss.stock.dto.PageResponse;
import com.ofss.stock.service.CustomerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private static final Set<String> SORT_FIELDS = Set.of("customerId", "customerName", "emailAddress");
    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse create(@Valid @RequestBody CustomerRequest request) {
        return customerService.create(request);
    }

    @GetMapping
    public List<CustomerResponse> list(@RequestParam(required = false) String query,
                                       @RequestParam(required = false) String name) {
        return customerService.list(query != null ? query : name);
    }

    @GetMapping("/page")
    public PageResponse<CustomerResponse> page(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "customerId") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        return customerService.page(query,
                PageRequest.of(page, size, sort(direction), allowedSort(sortBy)));
    }

    @GetMapping("/{customerId}")
    public CustomerResponse get(@PathVariable Long customerId) {
        return customerService.get(customerId);
    }

    @PutMapping("/{customerId}")
    public CustomerResponse update(@PathVariable Long customerId,
                                   @Valid @RequestBody CustomerRequest request) {
        return customerService.update(customerId, request);
    }

    @DeleteMapping("/{customerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long customerId) {
        customerService.delete(customerId);
    }

    private String allowedSort(String sortBy) {
        if (!SORT_FIELDS.contains(sortBy)) {
            throw new IllegalArgumentException("Unsupported customer sort field: " + sortBy);
        }
        return sortBy;
    }

    private Sort.Direction sort(String direction) {
        try {
            return Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Direction must be asc or desc");
        }
    }
}
