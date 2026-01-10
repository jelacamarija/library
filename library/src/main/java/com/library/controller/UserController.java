package com.library.controller;


import com.library.dto.UserListDto;
import com.library.dto.UserProfileDto;
import com.library.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserProfileDto me(HttpServletRequest request) {
        Long userID = (Long) request.getAttribute("userId");
        if (userID == null) throw new RuntimeException("Niste ulogovani");
        return userService.getMyProfile(userID);
    }

    // LIBRARIAN: lista svih CLIENT korisnika
    @GetMapping("/clients")
    public Page<UserListDto> allClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.getAllClients(page, size);
    }

    // LIBRARIAN: pretraga po cl. broju (contains)
    @GetMapping("/clients/search")
    public Page<UserListDto> searchClients(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.searchClientsByMembership(q, page, size);
    }

    // LIBRARIAN: tačan članski broj
    @GetMapping("/clients/by-membership/{membershipNumber}")
    public UserListDto byMembership(
            @PathVariable String membershipNumber,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.findClientByExactMembership(membershipNumber);
    }

    private void requireLibrarian(HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (role == null || !role.equalsIgnoreCase("LIBRARIAN")) {
            throw new RuntimeException("Zabranjen pristup");
        }
    }
}
