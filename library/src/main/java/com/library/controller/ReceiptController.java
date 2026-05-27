package com.library.controller;

import com.library.dto.ReceiptCreateDto;
import com.library.dto.ReceiptResponseDto;
import com.library.service.ReceiptService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptService receiptService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReceiptResponseDto createReceipt(
            @RequestBody ReceiptCreateDto dto,
            HttpServletRequest request
    ) {

        String role = (String) request.getAttribute("userRole");

        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Access denied");
        }

        Long librarianId =
                (Long) request.getAttribute("userId");

        return receiptService.createReceipt(
                dto,
                librarianId
        );
    }
}
