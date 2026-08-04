package com.ofss.stock.service;

import com.ofss.stock.dto.PageResponse;
import com.ofss.stock.dto.StockRequest;
import com.ofss.stock.dto.StockResponse;
import com.ofss.stock.dto.StockUpdateRequest;
import com.ofss.stock.entity.Stock;
import com.ofss.stock.exception.BusinessRuleException;
import com.ofss.stock.exception.DuplicateResourceException;
import com.ofss.stock.exception.ResourceNotFoundException;
import com.ofss.stock.repository.CustomerPortfolioRepository;
import com.ofss.stock.repository.StockRepository;
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
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);

    private final StockRepository stockRepository;
    private final StockTransactionRepository transactionRepository;
    private final CustomerPortfolioRepository portfolioRepository;

    public StockService(StockRepository stockRepository,
                        StockTransactionRepository transactionRepository,
                        CustomerPortfolioRepository portfolioRepository) {
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
        this.portfolioRepository = portfolioRepository;
    }

    @Transactional
    public StockResponse create(StockRequest request) {
        String symbol = normalizeSymbol(request.stockSymbol());
        if (stockRepository.existsById(symbol)) {
            throw new DuplicateResourceException("Stock already exists: " + symbol);
        }
        Stock stock = new Stock(symbol, request.stockName().trim(), request.currentPrice(),
                request.availableQuantity());
        Stock saved = stockRepository.save(stock);
        log.info("Created stock {}", symbol);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public StockResponse get(String symbol) {
        return toResponse(getEntity(symbol));
    }

    @Transactional(readOnly = true)
    public List<StockResponse> list(String query) {
        if (query == null || query.isBlank()) {
            return stockRepository.findAll(Sort.by("stockSymbol")).stream().map(this::toResponse).toList();
        }
        String term = query.trim();
        return stockRepository
                .findByStockSymbolContainingIgnoreCaseOrStockNameContainingIgnoreCase(
                        term, term, Pageable.unpaged(Sort.by("stockSymbol")))
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<StockResponse> page(String query, Pageable pageable) {
        Page<Stock> stocks = query == null || query.isBlank()
                ? stockRepository.findAll(pageable)
                : stockRepository.findByStockSymbolContainingIgnoreCaseOrStockNameContainingIgnoreCase(
                        query.trim(), query.trim(), pageable);
        return PageResponse.from(stocks.map(this::toResponse));
    }

    @Transactional
    public StockResponse update(String symbol, StockUpdateRequest request) {
        String normalized = normalizeSymbol(symbol);
        Stock stock = stockRepository.findBySymbolForUpdate(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found: " + normalized));
        stock.setStockName(request.stockName().trim());
        stock.setCurrentPrice(request.currentPrice());
        stock.setAvailableQuantity(request.availableQuantity());
        log.info("Updated stock {}", stock.getStockSymbol());
        return toResponse(stockRepository.save(stock));
    }

    @Transactional
    public void delete(String symbol) {
        String normalized = normalizeSymbol(symbol);
        Stock stock = stockRepository.findBySymbolForUpdate(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found: " + normalized));
        if (portfolioRepository.existsByStockStockSymbol(stock.getStockSymbol())
                || transactionRepository.existsByStockStockSymbol(stock.getStockSymbol())) {
            throw new BusinessRuleException(
                    "Stock cannot be deleted because it is referenced by a portfolio or transaction");
        }
        stockRepository.delete(stock);
        log.info("Deleted stock {}", stock.getStockSymbol());
    }

    Stock getEntity(String symbol) {
        String normalized = normalizeSymbol(symbol);
        return stockRepository.findById(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found: " + normalized));
    }

    public StockResponse toResponse(Stock stock) {
        return new StockResponse(stock.getStockSymbol(), stock.getStockName(), stock.getCurrentPrice(),
                stock.getAvailableQuantity());
    }

    public static String normalizeSymbol(String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new IllegalArgumentException("Stock symbol is required");
        }
        return symbol.trim().toUpperCase(Locale.ROOT);
    }
}
