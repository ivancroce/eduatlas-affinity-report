package com.ivancroce.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.prepost.PreAuthorize;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "EduAtlas Affinity Report API",
                version = "1.0",
                description = "API for Westcliff University EduAtlas"
        )
)
public class OpenApiConfig {

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public")
                .displayName("Public - Affinity Report")
                .pathsToMatch("/api/**")
                .addOperationCustomizer((operation, handlerMethod) -> {
                    if (handlerMethod.hasMethodAnnotation(PreAuthorize.class)) {
                        return null;
                    }
                    return operation;
                })
                .build();
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("admin")
                .displayName("Admin - Management")
                .pathsToMatch("/api/**")
                .addOperationCustomizer((operation, handlerMethod) -> {
                    if (handlerMethod.hasMethodAnnotation(PreAuthorize.class) ||
                            handlerMethod.getBeanType().getSimpleName().contains("Auth")) {
                        return operation;
                    }
                    return null;
                })
                .build();
    }
}