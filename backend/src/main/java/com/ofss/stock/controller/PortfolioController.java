package com.ofss.stock.controller;

import com.ofss.stock.dto.PortfolioResponse;
import com.ofss.stock.service.PortfolioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping("/api/portfolios")
    public List<PortfolioResponse> list() {
        return portfolioService.getAll();
    }

    @GetMapping({"/api/portfolios/{customerId}", "/api/customers/{customerId}/portfolio"})
    public PortfolioResponse getForCustomer(@PathVariable Long customerId) {
        return portfolioService.getForCustomer(customerId);
    }
}
