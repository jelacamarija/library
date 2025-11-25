package com.library.controller;

import com.library.dto.LoanCreateDto;
import com.library.dto.LoanResponseDto;
import com.library.service.LoanService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/create")
    public LoanResponseDto createLoan(@RequestBody LoanCreateDto dto,
                                      HttpServletRequest request) {

        String role= (String) request.getAttribute("userRole");

        if(!"LIBRARIAN".equalsIgnoreCase(role)){
            throw new RuntimeException("Samo bibliotekar moye izdati knjigu");
        }
        return loanService.createLoan(dto);
    }
}
