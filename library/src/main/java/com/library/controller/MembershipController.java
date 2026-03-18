package com.library.controller;

import com.library.dto.MembershipCashPaymentDto;
import com.library.service.MembershipService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RestController
@RequestMapping("/api/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @PostMapping("/cash")
    public String activateMembershipCash(
            @RequestBody MembershipCashPaymentDto dto,
            HttpServletRequest request
    ) {
        requireLibrarian(request);

        return membershipService.activateMembershipCash(dto.getMembershipNumber());
    }

    private void requireLibrarian(HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");

        if (role == null) {
            throw new RuntimeException("Niste ulogovani");
        }

        if (!"LIBRARIAN".equalsIgnoreCase(role)) {
            throw new RuntimeException("Zabranjen pristup");
        }
    }
}