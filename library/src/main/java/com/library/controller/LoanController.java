package com.library.controller;

import com.library.dto.LoanCreateDto;
import com.library.dto.LoanResponseDto;
import com.library.service.LoanService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping
    public Page<LoanResponseDto> getAllLoans(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "loanedAt,desc") String sort
    ) {
        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Pristup zabranjen: samo bibliotekar može vidjeti iznajmljivanja.");
        }
        return loanService.getAllLoans(page, size, sort);
    }

    @GetMapping("/search")
    public Page<LoanResponseDto> searchLoans(
            HttpServletRequest request,
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Pristup zabranjen: samo bibliotekar može pretraživati iznajmljivanja.");
        }
        return loanService.searchLoansByUserName(query, page, size);
    }

    @PatchMapping("/{loanID}/return")
    public LoanResponseDto returnBook(
            HttpServletRequest request,
            @PathVariable Long loanID
    ) {
        String role = (String) request.getAttribute("userRole");

        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Pristup zabranjen: samo bibliotekar može označiti vraćanje knjige.");
        }

        return loanService.returnBook(loanID);
    }

    @GetMapping("/active")
    public Page<LoanResponseDto> getActiveLoans(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Pristup zabranjen: samo bibliotekar može videti aktivna iznajmljivanja.");
        }
        return loanService.getActiveLoans(page, size);
    }

    @GetMapping("/my")
    public List<LoanResponseDto> getMyLoans(HttpServletRequest request) {
        return loanService.getMyLoans(request);
    }

    @GetMapping("/search-by-membership")
    public Page<LoanResponseDto> searchLoansByMembership(
            HttpServletRequest request,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "loanedAt,desc") String sort
    ) {
        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Pristup zabranjen: samo bibliotekar može vidjeti iznajmljivanja.");
        }

        return loanService.searchLoansByMembershipNumber(page, size, sort, q);
    }
}
