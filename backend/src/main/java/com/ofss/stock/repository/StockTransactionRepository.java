package com.ofss.stock.repository;

import com.ofss.stock.entity.StockTransaction;
import com.ofss.stock.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    @EntityGraph(attributePaths = {"customer", "stock"})
    List<StockTransaction> findAllByOrderByTransactionDateDescTransactionIdDesc();

    @Override
    @EntityGraph(attributePaths = {"customer", "stock"})
    Page<StockTransaction> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "stock"})
    List<StockTransaction> findByCustomerCustomerIdOrderByTransactionDateDescTransactionIdDesc(Long customerId);

    @EntityGraph(attributePaths = {"customer", "stock"})
    Optional<StockTransaction> findDetailedByTransactionId(Long transactionId);

    long countByTransactionType(TransactionType transactionType);

    boolean existsByCustomerCustomerId(Long customerId);

    boolean existsByStockStockSymbol(String stockSymbol);
}
