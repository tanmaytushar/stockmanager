package com.ofss.stock.controller;

import com.ofss.stock.dto.PageResponse;
import com.ofss.stock.dto.StockRequest;
import com.ofss.stock.dto.StockResponse;
import com.ofss.stock.dto.StockUpdateRequest;
import com.ofss.stock.service.StockService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/stocks")
public class StockController {

    private static final Set<String> SORT_FIELDS = Set.of(
            "stockSymbol", "stockName", "currentPrice", "availableQuantity");

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StockResponse create(@Valid @RequestBody StockRequest request) {
        return stockService.create(request);
    }

    @GetMapping
    public List<StockResponse> list(@RequestParam(required = false) String query) {
        return stockService.list(query);
    }

    @GetMapping("/page")
    public PageResponse<StockResponse> page(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "stockSymbol") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        return stockService.page(query, PageRequest.of(page, size, sort(direction), allowedSort(sortBy)));
    }

    @GetMapping("/{symbol}")
    public StockResponse get(@PathVariable String symbol) {
        return stockService.get(symbol);
    }

    @PutMapping("/{symbol}")
    public StockResponse update(@PathVariable String symbol,
                                @Valid @RequestBody StockUpdateRequest request) {
        return stockService.update(symbol, request);
    }

    @DeleteMapping("/{symbol}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String symbol) {
        stockService.delete(symbol);
    }

    private String allowedSort(String sortBy) {
        if (!SORT_FIELDS.contains(sortBy)) {
            throw new IllegalArgumentException("Unsupported stock sort field: " + sortBy);
        }
        return sortBy;
    }

    private Sort.Direction sort(String direction) {
        try {
            return Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Direction must be asc or desc");
        }
    }
}
