package com.spring.ai.restai.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "forward:/index.html";
    }
    
    // Forward all non-API routes to React app
    @RequestMapping(value = {
        "/app/**",
        "/dashboard/**",
        "/admin/**",
        "/barcode/**",
        "/qrcode/**",
        "/ocr/**",
        "/face/**",
        "/detection/**",
        "/models/**",
        "/documentation/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
