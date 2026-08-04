package com.ofss.stock.service;

import com.ofss.stock.dto.CustomerResponse;
import com.ofss.stock.dto.PortfolioResponse;
import com.ofss.stock.dto.StockResponse;
import com.ofss.stock.dto.StockTradeReport;
import com.ofss.stock.dto.TotalAssetValueResponse;
import com.ofss.stock.dto.TransactionResponse;
import com.ofss.stock.dto.TransactionTypeFrequencyResponse;
import com.ofss.stock.entity.Stock;
import com.ofss.stock.entity.StockTransaction;
import com.ofss.stock.entity.TransactionType;
import com.ofss.stock.exception.ResourceNotFoundException;
import com.ofss.stock.repository.StockRepository;
import com.ofss.stock.repository.StockTransactionRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final StockService stockService;
    private final CustomerService customerService;
    private final TransactionService transactionService;
    private final PortfolioService portfolioService;
    private final StockRepository stockRepository;
    private final StockTransactionRepository transactionRepository;

    public ReportService(StockService stockService,
                         CustomerService customerService,
                         TransactionService transactionService,
                         PortfolioService portfolioService,
                         StockRepository stockRepository,
                         StockTransactionRepository transactionRepository) {
        this.stockService = stockService;
        this.customerService = customerService;
        this.transactionService = transactionService;
        this.portfolioService = portfolioService;
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<StockResponse> allStocks() {
        return stockService.list(null);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> allCustomers() {
        return customerService.list(null);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> allTransactions() {
        return transactionService.list();
    }

    @Transactional(readOnly = true)
    public List<PortfolioResponse> allPortfolios() {
        return portfolioService.getAll();
    }

    @Transactional(readOnly = true)
    public PortfolioResponse highestPortfolio() {
        return portfolioService.getAll().stream()
                .sorted(Comparator.comparing(PortfolioResponse::totalAssetValue).reversed()
                        .thenComparing(PortfolioResponse::customerId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No customers are available"));
    }

    @Transactional(readOnly = true)
    public PortfolioResponse lowestPortfolio() {
        return portfolioService.getAll().stream()
                .min(Comparator.comparing(PortfolioResponse::totalAssetValue)
                        .thenComparing(PortfolioResponse::customerId))
                .orElseThrow(() -> new ResourceNotFoundException("No customers are available"));
    }

    @Transactional(readOnly = true)
    public StockTradeReport mostTradedStock() {
        return tradedStock(true);
    }

    @Transactional(readOnly = true)
    public StockTradeReport leastTradedStock() {
        return tradedStock(false);
    }

    @Transactional(readOnly = true)
    public StockResponse highestPricedStock() {
        Stock stock = stockRepository.findAll(Sort.by("stockSymbol")).stream()
                .sorted(Comparator.comparing(Stock::getCurrentPrice).reversed()
                        .thenComparing(Stock::getStockSymbol))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No stocks are available"));
        return stockService.toResponse(stock);
    }

    @Transactional(readOnly = true)
    public TransactionTypeFrequencyResponse transactionTypeFrequency() {
        long buyCount = transactionRepository.countByTransactionType(TransactionType.BUY);
        long sellCount = transactionRepository.countByTransactionType(TransactionType.SELL);
        String mostFrequent = buyCount == 0 && sellCount == 0 ? "NONE"
                : buyCount == sellCount ? "EQUAL"
                : buyCount > sellCount ? "BUY" : "SELL";
        return new TransactionTypeFrequencyResponse(buyCount, sellCount, mostFrequent);
    }

    @Transactional(readOnly = true)
    public TotalAssetValueResponse totalAssetValue() {
        BigDecimal total = portfolioService.getAll().stream()
                .map(PortfolioResponse::totalAssetValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new TotalAssetValueResponse(total);
    }

    private StockTradeReport tradedStock(boolean most) {
        List<Stock> stocks = stockRepository.findAll(Sort.by("stockSymbol"));
        if (stocks.isEmpty()) {
            throw new ResourceNotFoundException("No stocks are available");
        }
        Map<String, Long> counts = new HashMap<>();
        for (StockTransaction transaction : transactionRepository
                .findAllByOrderByTransactionDateDescTransactionIdDesc()) {
            counts.merge(transaction.getStock().getStockSymbol(), 1L, Long::sum);
        }
        Comparator<Stock> byCount = Comparator
                .comparingLong((Stock stock) -> counts.getOrDefault(stock.getStockSymbol(), 0L));
        Comparator<Stock> ordering = most
                ? byCount.reversed().thenComparing(Stock::getStockSymbol)
                : byCount.thenComparing(Stock::getStockSymbol);
        Stock stock = stocks.stream().sorted(ordering).findFirst().orElseThrow();
        return new StockTradeReport(stock.getStockSymbol(), stock.getStockName(),
                counts.getOrDefault(stock.getStockSymbol(), 0L));
    }
}
