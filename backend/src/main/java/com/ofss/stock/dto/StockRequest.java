package com.ofss.stock.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Max;

import java.math.BigDecimal;

public record StockRequest(
        @NotBlank @Size(max = 10)
        @Pattern(regexp = "[A-Za-z0-9.-]+", message = "must contain only letters, numbers, dots, or hyphens")
        String stockSymbol,
        @NotBlank @Size(max = 100) String stockName,
        @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal currentPrice,
        @NotNull @PositiveOrZero @Max(9_999_999_999L) Long availableQuantity
) {
}
