package com.library.controller;

import com.library.dto.RegisterRequestDto;
import com.library.service.AuthService;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/register")
@RequiredArgsConstructor
public class RegisterController {

    private final AuthService authService;

    @Value("${app.backend.base.url:http://localhost:8080}")
    private String backendBaseUrl;

    @Value("${app.frontend.base.url:http://localhost:4200}")
    private String frontendBaseUrl;


    @PostMapping
    public String registerUser(@RequestBody RegisterRequestDto dto){
        return authService.registerUser(dto,frontendBaseUrl);
    }

    @GetMapping("/verify")
    public String verifyUser(@RequestParam("code") String code){
        return authService.verifyRegistration(code);
    }
}
