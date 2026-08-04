package com.ofss.stock.dto;

import java.math.BigDecimal;
import java.util.List;

public record PortfolioResponse(
        Long customerId,
        String customerName,
        String emailAddress,
        List<PortfolioHoldingResponse> holdings,
        BigDecimal totalAssetValue
) {
}
