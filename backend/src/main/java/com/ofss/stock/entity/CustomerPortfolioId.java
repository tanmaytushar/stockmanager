package com.ofss.stock.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class CustomerPortfolioId implements Serializable {

    @Column(name = "CUSTOMER_ID")
    private Long customerId;

    @Column(name = "STOCK_SYMBOL", length = 10)
    private String stockSymbol;

    protected CustomerPortfolioId() {
    }

    public CustomerPortfolioId(Long customerId, String stockSymbol) {
        this.customerId = customerId;
        this.stockSymbol = stockSymbol;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getStockSymbol() {
        return stockSymbol;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof CustomerPortfolioId that)) {
            return false;
        }
        return Objects.equals(customerId, that.customerId)
                && Objects.equals(stockSymbol, that.stockSymbol);
    }

    @Override
    public int hashCode() {
        return Objects.hash(customerId, stockSymbol);
    }
}
