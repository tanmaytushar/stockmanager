package com.ofss.stock.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI stockManagerOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Stock Manager API")
                .version("1.0")
                .description("REST API for stocks, customers, trading, portfolios, and reports."));
    }
}
