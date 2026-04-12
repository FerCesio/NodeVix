package com.lab1.nodevix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaAuditing
public class NodevixApplication {

	public static void main(String[] args) {
		SpringApplication.run(NodevixApplication.class, args);
		System.out.println();
		System.out.println("Running...");
	}

}
