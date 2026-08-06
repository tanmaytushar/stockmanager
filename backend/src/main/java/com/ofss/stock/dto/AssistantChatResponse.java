package com.ofss.stock.dto;

public record AssistantChatResponse(
        String reply,
        AssistantTradeProposal tradeProposal,
        AssistantCustomerProposal customerProposal
) {
}
