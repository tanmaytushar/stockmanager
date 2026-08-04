package com.ofss.stock.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Max;

import java.math.BigDecimal;

public record StockUpdateRequest(
        @NotBlank @Size(max = 100) String stockName,
        @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal currentPrice,
        @NotNull @PositiveOrZero @Max(9_999_999_999L) Long availableQuantity
) {
}
