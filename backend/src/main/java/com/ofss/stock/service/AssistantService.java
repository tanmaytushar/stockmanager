package com.ofss.stock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ofss.stock.dto.PortfolioResponse;
import com.ofss.stock.dto.CustomerResponse;
import com.ofss.stock.dto.AssistantChatResponse;
import com.ofss.stock.dto.AssistantCustomerProposal;
import com.ofss.stock.dto.AssistantTradeProposal;
import com.ofss.stock.dto.StockResponse;
import com.ofss.stock.dto.TransactionResponse;
import com.ofss.stock.entity.TransactionType;
import com.ofss.stock.exception.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AssistantService {

    private static final String API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private final ReportService reportService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String model;

    public AssistantService(ReportService reportService,
                            ObjectMapper objectMapper,
                            @Value("${groq.api-key:}") String apiKey,
                            @Value("${groq.model:llama-3.3-70b-versatile}") String model) {
        this.reportService = reportService;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public AssistantChatResponse reply(String question) {
        if (apiKey.isBlank()) {
            throw new BusinessRuleException("AI assistant is not configured. Add GROQ_API_KEY to backend/.env and restart the backend.");
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", model);
            payload.put("messages", List.of(
                    Map.of("role", "system", "content", "You are the Stock Manager assistant. Answer only using the supplied workspace data. "
                            + "Customer details are included only for legitimate workspace questions. Use plain text only: do not use Markdown, tables, "
                            + "hash headings, asterisks, backticks, or pipe characters. For lists, put one item per line beginning with a bullet (•). "
                            + "Be concise, state when data is unavailable, "
                            + "and do not give investment advice or recommend buying or selling securities. If an admin clearly asks to buy or sell, "
                            + "use prepare_customer_trade with the supplied customer ID, stock symbol, and whole-number quantity. If an admin asks to register a customer and supplies a full name and email address, use prepare_customer_creation. These actions only prepare a confirmation; they never execute directly."),
                    Map.of("role", "user", "content", "WORKSPACE DATA:\n" + workspaceContext()
                            + "\n\nADMIN QUESTION:\n" + question.trim())));
            payload.put("tools", List.of(
                    Map.of("type", "function", "function", Map.of(
                            "name", "prepare_customer_trade",
                            "description", "Prepare a requested customer stock purchase or sale for the administrator to confirm.",
                            "parameters", Map.of(
                                    "type", "object",
                                    "properties", Map.of(
                                            "type", Map.of("type", "string", "enum", List.of("BUY", "SELL")),
                                            "customerId", Map.of("type", "integer"),
                                            "stockSymbol", Map.of("type", "string"),
                                            "quantity", Map.of("type", "integer", "minimum", 1)),
                                    "required", List.of("type", "customerId", "stockSymbol", "quantity"),
                                    "additionalProperties", false))),
                    Map.of("type", "function", "function", Map.of(
                            "name", "prepare_customer_creation",
                            "description", "Prepare a new customer registration when the administrator provides both the customer's full name and email address.",
                            "parameters", Map.of(
                                    "type", "object",
                                    "properties", Map.of(
                                            "customerName", Map.of("type", "string"),
                                            "emailAddress", Map.of("type", "string", "format", "email")),
                                    "required", List.of("customerName", "emailAddress"),
                                    "additionalProperties", false)))));
            HttpRequest request = HttpRequest.newBuilder(URI.create(API_URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BusinessRuleException("The AI assistant is temporarily unavailable. Please try again shortly.");
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode message = root.path("choices").path(0).path("message");
            AssistantTradeProposal proposal = tradeProposal(message);
            AssistantCustomerProposal customerProposal = customerProposal(message);
            String reply = message.path("content").asText();
            if (reply.isBlank() && proposal != null) {
                reply = "I prepared a " + proposal.type().name().toLowerCase() + " order for confirmation.";
            } else if (reply.isBlank() && customerProposal != null) {
                reply = "I prepared the customer registration for confirmation.";
            }
            if (reply.isBlank()) {
                throw new BusinessRuleException("The AI assistant returned an empty response. Please try again.");
            }
            return new AssistantChatResponse(reply, proposal, customerProposal);
        } catch (IOException e) {
            throw new BusinessRuleException("Unable to prepare the AI assistant request.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessRuleException("The AI assistant request was interrupted. Please try again.");
        }
    }

    private AssistantTradeProposal tradeProposal(JsonNode message) {
        JsonNode function = functionCall(message, "prepare_customer_trade");
        if (!"prepare_customer_trade".equals(function.path("name").asText())) {
            return null;
        }
        try {
            JsonNode arguments = objectMapper.readTree(function.path("arguments").asText());
            TransactionType type = TransactionType.valueOf(arguments.path("type").asText());
            long customerId = arguments.path("customerId").asLong();
            long quantity = arguments.path("quantity").asLong();
            String stockSymbol = arguments.path("stockSymbol").asText().trim().toUpperCase();
            if (customerId < 1 || quantity < 1 || stockSymbol.isBlank()) {
                return null;
            }
            return new AssistantTradeProposal(type, customerId, stockSymbol, quantity);
        } catch (IOException | IllegalArgumentException exception) {
            return null;
        }
    }

    private AssistantCustomerProposal customerProposal(JsonNode message) {
        JsonNode function = functionCall(message, "prepare_customer_creation");
        if (function.isMissingNode()) {
            return null;
        }
        try {
            JsonNode arguments = objectMapper.readTree(function.path("arguments").asText());
            String customerName = arguments.path("customerName").asText().trim();
            String emailAddress = arguments.path("emailAddress").asText().trim().toLowerCase();
            if (customerName.isBlank() || emailAddress.isBlank()) {
                return null;
            }
            return new AssistantCustomerProposal(customerName, emailAddress);
        } catch (IOException exception) {
            return null;
        }
    }

    private JsonNode functionCall(JsonNode message, String functionName) {
        for (JsonNode toolCall : message.path("tool_calls")) {
            JsonNode function = toolCall.path("function");
            if (functionName.equals(function.path("name").asText())) {
                return function;
            }
        }
        return objectMapper.missingNode();
    }
    private Map<String, Object> workspaceContext() {
        List<StockResponse> stocks = reportService.allStocks();
        List<CustomerResponse> customers = reportService.allCustomers();
        List<PortfolioResponse> portfolios = reportService.allPortfolios();
        List<TransactionResponse> transactions = reportService.allTransactions();
        BigDecimal totalAssets = portfolios.stream().map(PortfolioResponse::totalAssetValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("stocks", stocks.stream().map(stock -> Map.of(
                "symbol", stock.stockSymbol(), "name", stock.stockName(), "price", stock.currentPrice(),
                "availableQuantity", stock.availableQuantity())).toList());
        context.put("portfolioCount", portfolios.size());
        context.put("totalPortfolioAssetValue", totalAssets);
        context.put("customers", customers.stream().map(customer -> Map.of(
                "customerId", customer.customerId(), "name", customer.customerName(),
                "email", customer.emailAddress())).toList());
        context.put("portfolios", portfolios.stream().map(portfolio -> Map.of(
                "customerId", portfolio.customerId(), "customerName", portfolio.customerName(),
                "email", portfolio.emailAddress(), "totalAssetValue", portfolio.totalAssetValue(),
                "holdings", portfolio.holdings().stream().map(holding -> Map.of(
                        "symbol", holding.stockSymbol(), "name", holding.stockName(), "quantity", holding.quantity(),
                        "currentPrice", holding.currentPrice(), "totalAssetValue", holding.totalAssetValue())).toList())).toList());
        context.put("recentTransactions", transactions.stream().limit(25).map(transaction -> Map.of(
                "symbol", transaction.stockSymbol(), "type", transaction.transactionType(), "quantity", transaction.quantity(),
                "price", transaction.price(), "date", transaction.transactionDate())).toList());
        return context;
    }
}
