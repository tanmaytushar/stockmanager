package com.ofss.stock.service;

import com.ofss.stock.dto.PortfolioHoldingResponse;
import com.ofss.stock.dto.PortfolioResponse;
import com.ofss.stock.entity.Customer;
import com.ofss.stock.entity.CustomerPortfolio;
import com.ofss.stock.exception.ResourceNotFoundException;
import com.ofss.stock.repository.CustomerPortfolioRepository;
import com.ofss.stock.repository.CustomerRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PortfolioService {

    private final CustomerRepository customerRepository;
    private final CustomerPortfolioRepository portfolioRepository;

    public PortfolioService(CustomerRepository customerRepository,
                            CustomerPortfolioRepository portfolioRepository) {
        this.customerRepository = customerRepository;
        this.portfolioRepository = portfolioRepository;
    }

    @Transactional(readOnly = true)
    public PortfolioResponse getForCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
        return build(customer, portfolioRepository.findByCustomerIdWithDetails(customerId));
    }

    @Transactional(readOnly = true)
    public List<PortfolioResponse> getAll() {
        List<Customer> customers = customerRepository.findAll(Sort.by("customerId"));
        Map<Long, List<CustomerPortfolio>> holdingsByCustomer = new HashMap<>();
        for (CustomerPortfolio holding : portfolioRepository.findAllWithDetails()) {
            holdingsByCustomer.computeIfAbsent(holding.getCustomer().getCustomerId(), ignored -> new ArrayList<>())
                    .add(holding);
        }
        return customers.stream()
                .map(customer -> build(customer,
                        holdingsByCustomer.getOrDefault(customer.getCustomerId(), List.of())))
                .toList();
    }

    private PortfolioResponse build(Customer customer, List<CustomerPortfolio> holdings) {
        List<PortfolioHoldingResponse> items = holdings.stream().map(holding -> {
            BigDecimal value = holding.getStock().getCurrentPrice()
                    .multiply(BigDecimal.valueOf(holding.getQuantity()));
            return new PortfolioHoldingResponse(
                    holding.getStock().getStockSymbol(),
                    holding.getStock().getStockName(),
                    holding.getQuantity(),
                    holding.getStock().getCurrentPrice(),
                    value);
        }).toList();
        BigDecimal total = items.stream()
                .map(PortfolioHoldingResponse::totalAssetValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PortfolioResponse(customer.getCustomerId(), customer.getCustomerName(),
                customer.getEmailAddress(), items, total);
    }
}
