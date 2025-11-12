package com.library.controller;

import com.library.entity.User;
import com.library.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDto dto) {
        authService.register(dto);
        return ResponseEntity.ok("Registration successful! Check your email.");
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestParam("token") String token) {
        return ResponseEntity.ok(authService.verifyAccount(token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto dto) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
        );

        User user = (User) auth.getPrincipal();
        if (!user.isEnabled()) {
            throw new RuntimeException("Account not verified!");
        }

        String jwt = jwtService.generateToken(user);
        return ResponseEntity.ok(Map.of("token", jwt));
    }
}
