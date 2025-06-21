package com.spring.ai.restai.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("*")
                .maxAge(3600); // 1 hour
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve static assets (CSS, JS, images) from /assets/ path
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCachePeriod(31536000); // 1 year cache

        // Serve other static resources
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(86400); // 1 day cache
        
        // Serve favicon and other root level files
        registry.addResourceHandler("/favicon.ico", "/robots.txt", "/manifest.json")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(86400);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward all non-API requests to index.html for SPA routing
        registry.addViewController("/")
                .setViewName("forward:/index.html");
        registry.addViewController("/dashboard")
                .setViewName("forward:/index.html");
        registry.addViewController("/face-recognition")
                .setViewName("forward:/index.html");
        registry.addViewController("/ocr-detection")
                .setViewName("forward:/index.html");
        registry.addViewController("/object-detection")
                .setViewName("forward:/index.html");
        registry.addViewController("/barcode-detection")
                .setViewName("forward:/index.html");
        registry.addViewController("/qrcode-detection")
                .setViewName("forward:/index.html");
        registry.addViewController("/model-management")
                .setViewName("forward:/index.html");
        registry.addViewController("/documentation")
                .setViewName("forward:/index.html");
    }
}
