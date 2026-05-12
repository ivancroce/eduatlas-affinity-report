package com.ivancroce.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EduAtlasAffinityReportBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EduAtlasAffinityReportBackendApplication.class, args);
	}

}
