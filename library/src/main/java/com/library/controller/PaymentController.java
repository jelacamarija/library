package com.library.controller;

import com.library.dto.PaymentResponseDto;
import com.library.mapper.PaymentMapper;
import com.library.service.PayPalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PayPalService payPalService;

    // 🔴 CREATE ORDER
    @PostMapping("/create/{membershipId}")
    public String create(@PathVariable Long membershipId) {
        return payPalService.createOrder(membershipId);
    }

    // 🔴 SUCCESS
    @GetMapping("/success")
    public PaymentResponseDto success(@RequestParam("token") String token) {
        return PaymentMapper.toDto(payPalService.captureOrder(token));
    }

    // 🔴 CANCEL
    @GetMapping("/cancel")
    public PaymentResponseDto cancel(@RequestParam("token") String token) {
        return PaymentMapper.toDto(payPalService.cancelOrder(token));
    }
}