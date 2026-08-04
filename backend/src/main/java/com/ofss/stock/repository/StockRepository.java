package com.ofss.stock.repository;

import com.ofss.stock.entity.Stock;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, String> {

    Page<Stock> findByStockSymbolContainingIgnoreCaseOrStockNameContainingIgnoreCase(
            String stockSymbol, String stockName, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Stock s where s.stockSymbol = :symbol")
    Optional<Stock> findBySymbolForUpdate(@Param("symbol") String symbol);
}
