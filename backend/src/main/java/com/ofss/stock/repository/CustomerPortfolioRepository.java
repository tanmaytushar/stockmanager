package com.ofss.stock.repository;

import com.ofss.stock.entity.CustomerPortfolio;
import com.ofss.stock.entity.CustomerPortfolioId;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerPortfolioRepository extends JpaRepository<CustomerPortfolio, CustomerPortfolioId> {

    @Query("select p from CustomerPortfolio p join fetch p.customer join fetch p.stock "
            + "order by p.customer.customerId, p.stock.stockSymbol")
    List<CustomerPortfolio> findAllWithDetails();

    @Query("select p from CustomerPortfolio p join fetch p.customer join fetch p.stock "
            + "where p.customer.customerId = :customerId order by p.stock.stockSymbol")
    List<CustomerPortfolio> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from CustomerPortfolio p where p.id.customerId = :customerId "
            + "and p.id.stockSymbol = :stockSymbol")
    Optional<CustomerPortfolio> findForUpdate(@Param("customerId") Long customerId,
                                               @Param("stockSymbol") String stockSymbol);

    boolean existsByCustomerCustomerId(Long customerId);

    boolean existsByStockStockSymbol(String stockSymbol);
}
