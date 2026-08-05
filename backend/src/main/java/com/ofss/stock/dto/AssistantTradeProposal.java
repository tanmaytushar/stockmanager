package com.ofss.stock.dto;

import com.ofss.stock.entity.TransactionType;

public record AssistantTradeProposal(
        TransactionType type,
        Long customerId,
        String stockSymbol,
        Long quantity
) {
}
