package com.ofss.stock.service;

import com.ofss.stock.dto.PortfolioResponse;
import com.ofss.stock.dto.StockTradeReport;
import com.ofss.stock.entity.Customer;
import com.ofss.stock.entity.Stock;
import com.ofss.stock.entity.StockTransaction;
import com.ofss.stock.entity.TransactionType;
import com.ofss.stock.repository.StockRepository;
import com.ofss.stock.repository.StockTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private StockService stockService;
    @Mock
    private CustomerService customerService;
    @Mock
    private TransactionService transactionService;
    @Mock
    private PortfolioService portfolioService;
    @Mock
    private StockRepository stockRepository;
    @Mock
    private StockTransactionRepository transactionRepository;

    private ReportService service;

    @BeforeEach
    void setUp() {
        service = new ReportService(stockService, customerService, transactionService, portfolioService,
                stockRepository, transactionRepository);
    }

    @Test
    void leastTradedStockIncludesStocksWithNoTransactions() {
        Stock aapl = new Stock("AAPL", "Apple", new BigDecimal("100.00"), 10L);
        Stock orcl = new Stock("ORCL", "Oracle", new BigDecimal("120.00"), 10L);
        Customer customer = new Customer("Ada", "ada@example.com");
        ReflectionTestUtils.setField(customer, "customerId", 1L);
        StockTransaction trade = new StockTransaction(customer, aapl, TransactionType.BUY, 1L,
                aapl.getCurrentPrice());
        when(stockRepository.findAll(any(Sort.class))).thenReturn(List.of(aapl, orcl));
        when(transactionRepository.findAllByOrderByTransactionDateDescTransactionIdDesc())
                .thenReturn(List.of(trade));

        StockTradeReport report = service.leastTradedStock();

        assertThat(report.stockSymbol()).isEqualTo("ORCL");
        assertThat(report.tradeCount()).isZero();
    }

    @Test
    void lowestPortfolioIncludesCustomerWithNoHoldings() {
        PortfolioResponse funded = new PortfolioResponse(1L, "Funded", "f@example.com", List.of(),
                new BigDecimal("100.00"));
        PortfolioResponse empty = new PortfolioResponse(2L, "Empty", "e@example.com", List.of(),
                BigDecimal.ZERO);
        when(portfolioService.getAll()).thenReturn(List.of(funded, empty));

        assertThat(service.lowestPortfolio().customerId()).isEqualTo(2L);
    }
}
