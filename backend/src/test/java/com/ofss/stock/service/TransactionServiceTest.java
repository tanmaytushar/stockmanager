package com.ofss.stock.service;

import com.ofss.stock.dto.TradeRequest;
import com.ofss.stock.dto.TransactionResponse;
import com.ofss.stock.entity.Customer;
import com.ofss.stock.entity.CustomerPortfolio;
import com.ofss.stock.entity.Stock;
import com.ofss.stock.entity.StockTransaction;
import com.ofss.stock.entity.TransactionType;
import com.ofss.stock.exception.BusinessRuleException;
import com.ofss.stock.repository.CustomerPortfolioRepository;
import com.ofss.stock.repository.CustomerRepository;
import com.ofss.stock.repository.StockRepository;
import com.ofss.stock.repository.StockTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private StockRepository stockRepository;
    @Mock
    private CustomerPortfolioRepository portfolioRepository;
    @Mock
    private StockTransactionRepository transactionRepository;

    private TransactionService service;
    private Customer customer;
    private Stock stock;

    @BeforeEach
    void setUp() {
        service = new TransactionService(customerRepository, stockRepository, portfolioRepository,
                transactionRepository);
        customer = new Customer("Ada Lovelace", "ada@example.com");
        ReflectionTestUtils.setField(customer, "customerId", 1L);
        stock = new Stock("ORCL", "Oracle Corporation", new BigDecimal("142.30"), 100L);

        when(customerRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(customer));
        when(stockRepository.findBySymbolForUpdate("ORCL")).thenReturn(Optional.of(stock));
    }

    @Test
    void buyReducesAvailableQuantityAndAddsToHolding() {
        CustomerPortfolio holding = new CustomerPortfolio(customer, stock, 5L);
        when(portfolioRepository.findForUpdate(1L, "ORCL")).thenReturn(Optional.of(holding));
        when(transactionRepository.save(any(StockTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = service.buy(new TradeRequest(1L, "orcl", 10L));

        assertThat(stock.getAvailableQuantity()).isEqualTo(90L);
        assertThat(holding.getQuantity()).isEqualTo(15L);
        assertThat(response.transactionType()).isEqualTo(TransactionType.BUY);
        assertThat(response.price()).isEqualByComparingTo("142.30");
        verify(stockRepository).save(stock);
        verify(portfolioRepository).save(holding);
        verify(transactionRepository).save(any(StockTransaction.class));
    }

    @Test
    void fullSellRemovesHoldingAndRestoresStock() {
        CustomerPortfolio holding = new CustomerPortfolio(customer, stock, 10L);
        when(portfolioRepository.findForUpdate(1L, "ORCL")).thenReturn(Optional.of(holding));
        when(transactionRepository.save(any(StockTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = service.sell(new TradeRequest(1L, "ORCL", 10L));

        assertThat(stock.getAvailableQuantity()).isEqualTo(110L);
        assertThat(response.transactionType()).isEqualTo(TransactionType.SELL);
        verify(portfolioRepository).delete(holding);
        verify(portfolioRepository, never()).save(holding);
        verify(transactionRepository).save(any(StockTransaction.class));
    }

    @Test
    void buyRejectsInsufficientAvailableQuantityWithoutWriting() {
        stock.setAvailableQuantity(3L);

        assertThatThrownBy(() -> service.buy(new TradeRequest(1L, "ORCL", 5L)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("only 3");

        verify(portfolioRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void sellRejectsInsufficientOwnedQuantityWithoutWriting() {
        CustomerPortfolio holding = new CustomerPortfolio(customer, stock, 2L);
        when(portfolioRepository.findForUpdate(1L, "ORCL")).thenReturn(Optional.of(holding));

        assertThatThrownBy(() -> service.sell(new TradeRequest(1L, "ORCL", 3L)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("owns 2");

        verify(stockRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }
}
