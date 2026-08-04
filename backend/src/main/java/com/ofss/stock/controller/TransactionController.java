package com.ofss.stock.controller;

import com.ofss.stock.dto.PageResponse;
import com.ofss.stock.dto.TradeRequest;
import com.ofss.stock.dto.TransactionResponse;
import com.ofss.stock.service.TransactionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private static final Set<String> SORT_FIELDS = Set.of(
            "transactionId", "transactionDate", "transactionType", "quantity", "price");
    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/buy")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse buy(@Valid @RequestBody TradeRequest request) {
        return transactionService.buy(request);
    }

    @PostMapping("/sell")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse sell(@Valid @RequestBody TradeRequest request) {
        return transactionService.sell(request);
    }

    @GetMapping
    public List<TransactionResponse> list() {
        return transactionService.list();
    }

    @GetMapping("/page")
    public PageResponse<TransactionResponse> page(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        if (!SORT_FIELDS.contains(sortBy)) {
            throw new IllegalArgumentException("Unsupported transaction sort field: " + sortBy);
        }
        Sort.Direction sortDirection;
        try {
            sortDirection = Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Direction must be asc or desc");
        }
        return transactionService.page(PageRequest.of(page, size, sortDirection, sortBy));
    }

    @GetMapping("/customer/{customerId}")
    public List<TransactionResponse> listForCustomer(@PathVariable Long customerId) {
        return transactionService.listForCustomer(customerId);
    }

    @GetMapping("/{transactionId}")
    public TransactionResponse get(@PathVariable Long transactionId) {
        return transactionService.get(transactionId);
    }
}
