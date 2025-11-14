package com.library.controller;

import com.library.dto.LoginRequestDto;
import com.library.dto.LoginResponseDto;
import com.library.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/login")
@RequiredArgsConstructor
public class LoginController {

    private final AuthService authService;

    @PostMapping
    public LoginResponseDto login(@RequestBody LoginRequestDto request) {
        return authService.loginUser(request);
    }
}
