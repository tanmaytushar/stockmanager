package com.ofss.stock.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TradeRequest(
        @NotNull @Positive Long customerId,
        @NotBlank @Size(max = 10)
        @Pattern(regexp = "[A-Za-z0-9.-]+", message = "must contain only letters, numbers, dots, or hyphens")
        String stockSymbol,
        @NotNull @Positive @Max(9_999_999_999L) Long quantity
) {
}
