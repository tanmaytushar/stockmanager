package com.ofss.stock.dto;

public record CustomerResponse(
        Long customerId,
        String customerName,
        String emailAddress
) {
}
