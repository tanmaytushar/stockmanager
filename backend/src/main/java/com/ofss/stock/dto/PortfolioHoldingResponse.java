package com.ofss.stock.dto;

import java.math.BigDecimal;

public record PortfolioHoldingResponse(
        String stockSymbol,
        String stockName,
        Long quantity,
        BigDecimal currentPrice,
        BigDecimal totalAssetValue
) {
}
