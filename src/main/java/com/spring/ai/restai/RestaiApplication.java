package com.spring.ai.restai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.spring.ai.restai")
public class RestaiApplication {

	static {
		try {
			nu.pattern.OpenCV.loadLocally();
			System.out.println("OpenCV loaded successfully");
		} catch (Exception e) {
			System.err.println("Failed to load OpenCV: " + e.getMessage());
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(RestaiApplication.class, args);
	}
}
 