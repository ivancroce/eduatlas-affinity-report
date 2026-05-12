package com.ivancroce.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "EduAtlas Affinity Report API",
                version = "1.0",
                description = "API for Westcliff University EduAtlas"
        ),
        security = { @SecurityRequirement(name = "bearerAuth") }
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Paste the access token returned by POST /api/auth/login (without the 'Bearer ' prefix)"
)
public class OpenApiConfig {

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public")
                .displayName("Public - Affinity Report")
                .pathsToMatch(
                        "/api/auth/**",
                        "/api/feedback",
                        "/api/countries/simple",
                        "/api/countries/comparison",
                        "/api/countries/*/representative-program",
                        "/api/countries/*/has-special-program",
                        "/api/countries/*"
                )
                .pathsToExclude("/api/countries/search")
                .build();
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("admin")
                .displayName("Admin - Management")
                .pathsToMatch("/api/**")
                .pathsToExclude(
                        "/api/auth/**",
                        "/api/feedback",
                        "/api/countries/simple",
                        "/api/countries/comparison",
                        "/api/countries/*/representative-program",
                        "/api/countries/*/has-special-program"
                )
                .build();
    }
}
