package com.ofss.stock.repository;

import com.ofss.stock.entity.Customer;
import com.ofss.stock.entity.CustomerPortfolio;
import com.ofss.stock.entity.Stock;
import com.ofss.stock.entity.StockTransaction;
import com.ofss.stock.entity.TransactionType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class RepositoryMappingTest {

    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private StockRepository stockRepository;
    @Autowired
    private CustomerPortfolioRepository portfolioRepository;
    @Autowired
    private StockTransactionRepository transactionRepository;

    @Test
    void mappingsAndDetailedQueriesWorkWithAnEmbeddedDatabase() {
        Customer customer = customerRepository.saveAndFlush(
                new Customer("Ada Lovelace", "ada@example.com"));
        Stock stock = stockRepository.saveAndFlush(
                new Stock("ORCL", "Oracle Corporation", new BigDecimal("142.30"), 100L));
        portfolioRepository.saveAndFlush(new CustomerPortfolio(customer, stock, 4L));
        StockTransaction transaction = transactionRepository.saveAndFlush(
                new StockTransaction(customer, stock, TransactionType.BUY, 4L,
                        stock.getCurrentPrice()));

        assertThat(transactionRepository.findDetailedByTransactionId(transaction.getTransactionId()))
                .get()
                .extracting(saved -> saved.getCustomer().getCustomerName(),
                        saved -> saved.getStock().getStockSymbol())
                .containsExactly("Ada Lovelace", "ORCL");
        assertThat(portfolioRepository.findForUpdate(customer.getCustomerId(), "ORCL"))
                .get()
                .extracting(CustomerPortfolio::getQuantity)
                .isEqualTo(4L);
    }
}
