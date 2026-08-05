package com.ofss.stock.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssistantChatRequest(
        @NotBlank(message = "A chat message is required")
        @Size(max = 2000, message = "Chat messages must be 2000 characters or fewer")
        String message) {
}
