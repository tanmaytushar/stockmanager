package com.ofss.stock.dto;

import java.math.BigDecimal;

public record StockResponse(
        String stockSymbol,
        String stockName,
        BigDecimal currentPrice,
        Long availableQuantity
) {
}
