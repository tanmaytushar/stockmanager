package com.ofss.stock.service;

import com.ofss.stock.dto.PageResponse;
import com.ofss.stock.dto.TradeRequest;
import com.ofss.stock.dto.TransactionResponse;
import com.ofss.stock.entity.Customer;
import com.ofss.stock.entity.CustomerPortfolio;
import com.ofss.stock.entity.Stock;
import com.ofss.stock.entity.StockTransaction;
import com.ofss.stock.entity.TransactionType;
import com.ofss.stock.exception.BusinessRuleException;
import com.ofss.stock.exception.ResourceNotFoundException;
import com.ofss.stock.repository.CustomerPortfolioRepository;
import com.ofss.stock.repository.CustomerRepository;
import com.ofss.stock.repository.StockRepository;
import com.ofss.stock.repository.StockTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);
    private static final long MAX_DATABASE_QUANTITY = 9_999_999_999L;

    private final CustomerRepository customerRepository;
    private final StockRepository stockRepository;
    private final CustomerPortfolioRepository portfolioRepository;
    private final StockTransactionRepository transactionRepository;

    public TransactionService(CustomerRepository customerRepository,
                              StockRepository stockRepository,
                              CustomerPortfolioRepository portfolioRepository,
                              StockTransactionRepository transactionRepository) {
        this.customerRepository = customerRepository;
        this.stockRepository = stockRepository;
        this.portfolioRepository = portfolioRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public TransactionResponse buy(TradeRequest request) {
        Customer customer = findCustomerForUpdate(request.customerId());
        String symbol = StockService.normalizeSymbol(request.stockSymbol());
        Stock stock = findStockForUpdate(symbol);

        if (stock.getAvailableQuantity() < request.quantity()) {
            throw new BusinessRuleException("Insufficient available stock. Requested " + request.quantity()
                    + " but only " + stock.getAvailableQuantity() + " is available");
        }

        stock.setAvailableQuantity(stock.getAvailableQuantity() - request.quantity());
        CustomerPortfolio holding = portfolioRepository.findForUpdate(customer.getCustomerId(), symbol)
                .orElseGet(() -> new CustomerPortfolio(customer, stock, 0L));
        long newHoldingQuantity = Math.addExact(holding.getQuantity(), request.quantity());
        requireDatabaseQuantity(newHoldingQuantity, "Portfolio quantity");
        holding.setQuantity(newHoldingQuantity);

        stockRepository.save(stock);
        portfolioRepository.save(holding);
        StockTransaction transaction = transactionRepository.save(
                new StockTransaction(customer, stock, TransactionType.BUY, request.quantity(),
                        stock.getCurrentPrice()));
        log.info("Customer {} bought {} units of {}", customer.getCustomerId(), request.quantity(), symbol);
        return toResponse(transaction);
    }

    @Transactional
    public TransactionResponse sell(TradeRequest request) {
        Customer customer = findCustomerForUpdate(request.customerId());
        String symbol = StockService.normalizeSymbol(request.stockSymbol());
        Stock stock = findStockForUpdate(symbol);
        CustomerPortfolio holding = portfolioRepository.findForUpdate(customer.getCustomerId(), symbol)
                .orElseThrow(() -> new BusinessRuleException(
                        "Customer does not own stock " + symbol));

        if (holding.getQuantity() < request.quantity()) {
            throw new BusinessRuleException("Insufficient owned quantity. Requested " + request.quantity()
                    + " but customer owns " + holding.getQuantity());
        }

        long remaining = holding.getQuantity() - request.quantity();
        long newAvailableQuantity = Math.addExact(stock.getAvailableQuantity(), request.quantity());
        requireDatabaseQuantity(newAvailableQuantity, "Available stock quantity");
        stock.setAvailableQuantity(newAvailableQuantity);
        stockRepository.save(stock);
        if (remaining == 0) {
            portfolioRepository.delete(holding);
        } else {
            holding.setQuantity(remaining);
            portfolioRepository.save(holding);
        }

        StockTransaction transaction = transactionRepository.save(
                new StockTransaction(customer, stock, TransactionType.SELL, request.quantity(),
                        stock.getCurrentPrice()));
        log.info("Customer {} sold {} units of {}", customer.getCustomerId(), request.quantity(), symbol);
        return toResponse(transaction);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> list() {
        return transactionRepository.findAllByOrderByTransactionDateDescTransactionIdDesc()
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TransactionResponse get(Long transactionId) {
        return transactionRepository.findDetailedByTransactionId(transactionId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaction not found: " + transactionId));
    }

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> page(Pageable pageable) {
        return PageResponse.from(transactionRepository.findAll(pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> listForCustomer(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found: " + customerId);
        }
        return transactionRepository
                .findByCustomerCustomerIdOrderByTransactionDateDescTransactionIdDesc(customerId)
                .stream().map(this::toResponse).toList();
    }

    public TransactionResponse toResponse(StockTransaction transaction) {
        return new TransactionResponse(
                transaction.getTransactionId(),
                transaction.getCustomer().getCustomerId(),
                transaction.getCustomer().getCustomerName(),
                transaction.getStock().getStockSymbol(),
                transaction.getStock().getStockName(),
                transaction.getTransactionType(),
                transaction.getQuantity(),
                transaction.getPrice(),
                transaction.getTransactionDate());
    }

    private Customer findCustomerForUpdate(Long customerId) {
        return customerRepository.findByIdForUpdate(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
    }

    private Stock findStockForUpdate(String symbol) {
        return stockRepository.findBySymbolForUpdate(symbol)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found: " + symbol));
    }

    private void requireDatabaseQuantity(long quantity, String field) {
        if (quantity > MAX_DATABASE_QUANTITY) {
            throw new BusinessRuleException(field + " exceeds the database limit");
        }
    }
}
