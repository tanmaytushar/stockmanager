package com.ofss.stock.dto;

import com.ofss.stock.entity.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse(
        Long transactionId,
        Long customerId,
        String customerName,
        String stockSymbol,
        String stockName,
        TransactionType transactionType,
        Long quantity,
        BigDecimal price,
        LocalDateTime transactionDate
) {
}
