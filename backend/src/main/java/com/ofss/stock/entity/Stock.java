package com.ofss.stock.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "STOCK")
public class Stock {

    @Id
    @Column(name = "STOCK_SYMBOL", length = 10, nullable = false)
    private String stockSymbol;

    @Column(name = "STOCK_NAME", length = 100, nullable = false)
    private String stockName;

    @Column(name = "CURRENT_PRICE", precision = 10, scale = 2, nullable = false)
    private BigDecimal currentPrice;

    @Column(name = "AVAILABLE_QUANTITY", nullable = false)
    private Long availableQuantity;

    protected Stock() {
    }

    public Stock(String stockSymbol, String stockName, BigDecimal currentPrice, Long availableQuantity) {
        this.stockSymbol = stockSymbol;
        this.stockName = stockName;
        this.currentPrice = currentPrice;
        this.availableQuantity = availableQuantity;
    }

    public String getStockSymbol() {
        return stockSymbol;
    }

    public String getStockName() {
        return stockName;
    }

    public void setStockName(String stockName) {
        this.stockName = stockName;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
    }

    public Long getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Long availableQuantity) {
        this.availableQuantity = availableQuantity;
    }
}
