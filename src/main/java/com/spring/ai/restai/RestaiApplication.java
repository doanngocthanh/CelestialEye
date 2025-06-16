package com.spring.ai.restai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.spring.ai.restai")
public class RestaiApplication {

	public static void main(String[] args) {
		SpringApplication.run(RestaiApplication.class, args);
	}

}
