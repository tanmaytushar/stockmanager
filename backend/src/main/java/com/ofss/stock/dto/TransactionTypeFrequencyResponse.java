package com.ofss.stock.dto;

public record TransactionTypeFrequencyResponse(
        long buyCount,
        long sellCount,
        String mostFrequentType
) {
}
