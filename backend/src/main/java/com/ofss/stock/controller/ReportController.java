package com.ofss.stock.controller;

import com.ofss.stock.dto.CustomerResponse;
import com.ofss.stock.dto.PortfolioResponse;
import com.ofss.stock.dto.StockResponse;
import com.ofss.stock.dto.StockTradeReport;
import com.ofss.stock.dto.TotalAssetValueResponse;
import com.ofss.stock.dto.TransactionResponse;
import com.ofss.stock.dto.TransactionTypeFrequencyResponse;
import com.ofss.stock.service.ReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/stocks")
    public List<StockResponse> allStocks() {
        return reportService.allStocks();
    }

    @GetMapping("/customers")
    public List<CustomerResponse> allCustomers() {
        return reportService.allCustomers();
    }

    @GetMapping("/transactions")
    public List<TransactionResponse> allTransactions() {
        return reportService.allTransactions();
    }

    @GetMapping("/portfolios")
    public List<PortfolioResponse> allPortfolios() {
        return reportService.allPortfolios();
    }

    @GetMapping("/highest-portfolio")
    public PortfolioResponse highestPortfolio() {
        return reportService.highestPortfolio();
    }

    @GetMapping("/lowest-portfolio")
    public PortfolioResponse lowestPortfolio() {
        return reportService.lowestPortfolio();
    }

    @GetMapping("/most-traded-stock")
    public StockTradeReport mostTradedStock() {
        return reportService.mostTradedStock();
    }

    @GetMapping("/least-traded-stock")
    public StockTradeReport leastTradedStock() {
        return reportService.leastTradedStock();
    }

    @GetMapping("/highest-priced-stock")
    public StockResponse highestPricedStock() {
        return reportService.highestPricedStock();
    }

    @GetMapping("/transaction-type-frequency")
    public TransactionTypeFrequencyResponse transactionTypeFrequency() {
        return reportService.transactionTypeFrequency();
    }

    @GetMapping("/total-asset-value")
    public TotalAssetValueResponse totalAssetValue() {
        return reportService.totalAssetValue();
    }
}
