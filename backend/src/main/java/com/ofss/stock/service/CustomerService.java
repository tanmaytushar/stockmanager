package com.ofss.stock.service;

import com.ofss.stock.dto.CustomerRequest;
import com.ofss.stock.dto.CustomerResponse;
import com.ofss.stock.dto.PageResponse;
import com.ofss.stock.entity.Customer;
import com.ofss.stock.exception.BusinessRuleException;
import com.ofss.stock.exception.DuplicateResourceException;
import com.ofss.stock.exception.ResourceNotFoundException;
import com.ofss.stock.repository.CustomerPortfolioRepository;
import com.ofss.stock.repository.CustomerRepository;
import com.ofss.stock.repository.StockTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository customerRepository;
    private final StockTransactionRepository transactionRepository;
    private final CustomerPortfolioRepository portfolioRepository;

    public CustomerService(CustomerRepository customerRepository,
                           StockTransactionRepository transactionRepository,
                           CustomerPortfolioRepository portfolioRepository) {
        this.customerRepository = customerRepository;
        this.transactionRepository = transactionRepository;
        this.portfolioRepository = portfolioRepository;
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        String email = normalizeEmail(request.emailAddress());
        if (customerRepository.existsByEmailAddressIgnoreCase(email)) {
            throw new DuplicateResourceException("A customer already uses email: " + email);
        }
        Customer saved = customerRepository.save(new Customer(request.customerName().trim(), email));
        log.info("Registered customer {}", saved.getCustomerId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CustomerResponse get(Long customerId) {
        return toResponse(getEntity(customerId));
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> list(String query) {
        if (query == null || query.isBlank()) {
            return customerRepository.findAll(Sort.by("customerId")).stream().map(this::toResponse).toList();
        }
        String term = query.trim();
        return customerRepository
                .findByCustomerNameContainingIgnoreCaseOrEmailAddressContainingIgnoreCase(
                        term, term, Pageable.unpaged(Sort.by("customerId")))
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> page(String query, Pageable pageable) {
        Page<Customer> customers = query == null || query.isBlank()
                ? customerRepository.findAll(pageable)
                : customerRepository.findByCustomerNameContainingIgnoreCaseOrEmailAddressContainingIgnoreCase(
                        query.trim(), query.trim(), pageable);
        return PageResponse.from(customers.map(this::toResponse));
    }

    @Transactional
    public CustomerResponse update(Long customerId, CustomerRequest request) {
        Customer customer = getEntity(customerId);
        String email = normalizeEmail(request.emailAddress());
        if (customerRepository.existsByEmailAddressIgnoreCaseAndCustomerIdNot(email, customerId)) {
            throw new DuplicateResourceException("A customer already uses email: " + email);
        }
        customer.setCustomerName(request.customerName().trim());
        customer.setEmailAddress(email);
        log.info("Updated customer {}", customerId);
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public void delete(Long customerId) {
        Customer customer = getEntity(customerId);
        if (portfolioRepository.existsByCustomerCustomerId(customerId)
                || transactionRepository.existsByCustomerCustomerId(customerId)) {
            throw new BusinessRuleException(
                    "Customer cannot be deleted because they have a portfolio or transaction history");
        }
        customerRepository.delete(customer);
        log.info("Deleted customer {}", customerId);
    }

    Customer getEntity(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
    }

    public CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(customer.getCustomerId(), customer.getCustomerName(),
                customer.getEmailAddress());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
