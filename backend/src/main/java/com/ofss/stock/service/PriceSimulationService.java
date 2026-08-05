package com.ofss.stock.service;

import com.ofss.stock.entity.Stock;
import com.ofss.stock.repository.StockRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Updates the current simulated market price once per second. Prices are kept
 * only in STOCK.CURRENT_PRICE; no price history is stored.
 */
@Service
public class PriceSimulationService {

    private static final BigDecimal MINIMUM_PRICE = new BigDecimal("0.01");
    private static final double MAX_PERCENTAGE_CHANGE = 0.0015; // +/- 0.15% per second

    private final StockRepository stockRepository;

    public PriceSimulationService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    @Scheduled(fixedRate = 1_000)
    @Transactional
    public void updateCurrentPrices() {
        stockRepository.findAllForPriceUpdate().forEach(stock -> stock.setCurrentPrice(nextPrice(stock)));
    }

    private BigDecimal nextPrice(Stock stock) {
        BigDecimal currentPrice = stock.getCurrentPrice();
        double change = ThreadLocalRandom.current().nextDouble(
                -MAX_PERCENTAGE_CHANGE, MAX_PERCENTAGE_CHANGE);
        BigDecimal nextPrice = currentPrice
                .multiply(BigDecimal.ONE.add(BigDecimal.valueOf(change)))
                .setScale(2, RoundingMode.HALF_UP);

        if (nextPrice.compareTo(currentPrice) == 0) {
            nextPrice = currentPrice.add(change >= 0 ? MINIMUM_PRICE : MINIMUM_PRICE.negate());
        }
        return nextPrice.max(MINIMUM_PRICE).setScale(2, RoundingMode.HALF_UP);
    }
}
