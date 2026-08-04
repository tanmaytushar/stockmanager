package com.ofss.stock.dto;

public record StockTradeReport(
        String stockSymbol,
        String stockName,
        long tradeCount
) {
}
