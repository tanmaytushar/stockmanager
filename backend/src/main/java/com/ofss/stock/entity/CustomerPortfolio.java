package com.ofss.stock.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "CUSTOMER_PORTFOLIO")
public class CustomerPortfolio {

    @EmbeddedId
    private CustomerPortfolioId id;

    @MapsId("customerId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CUSTOMER_ID", nullable = false)
    private Customer customer;

    @MapsId("stockSymbol")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "STOCK_SYMBOL", nullable = false)
    private Stock stock;

    @Column(name = "QUANTITY", nullable = false)
    private Long quantity;

    protected CustomerPortfolio() {
    }

    public CustomerPortfolio(Customer customer, Stock stock, Long quantity) {
        this.id = new CustomerPortfolioId(customer.getCustomerId(), stock.getStockSymbol());
        this.customer = customer;
        this.stock = stock;
        this.quantity = quantity;
    }

    public CustomerPortfolioId getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public Stock getStock() {
        return stock;
    }

    public Long getQuantity() {
        return quantity;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }
}
