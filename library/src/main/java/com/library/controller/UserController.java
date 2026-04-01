package com.library.controller;


import com.library.dto.*;
import com.library.service.AuthService;
import com.library.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @GetMapping("/me")
    public ClientProfileDto me(HttpServletRequest request) {
        Long userID = (Long) request.getAttribute("userId");
        if (userID == null) throw new RuntimeException("Niste ulogovani");
        return userService.getMyProfile(userID);
    }

    @GetMapping("/clients")
    public Page<ClientListDto> allClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.getAllClients(page, size);
    }

    @GetMapping("/clients/search")
    public Page<ClientListDto> searchClients(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.searchClientsByMembership(q, page, size);
    }

    @GetMapping("/clients/by-membership/{membershipNumber}")
    public ClientListDto byMembership(
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

    @PostMapping("/create")
    public String createUser(@Valid @RequestBody LibrarianCreateUserDto dto,
                             HttpServletRequest request) {
        requireLibrarian(request);
        return authService.createUserByLibrarian(dto);
    }

    @PostMapping("/create-librarian")
    public String createLibrarian(
            @RequestBody LibrarianCreateUserDto dto,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return authService.createLibrarianByLibrarian(dto);
    }

    @PatchMapping("/{id}/phone")
    public ClientListDto updatePhone(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePhoneDto dto,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.updateUserPhone(id, dto.getPhoneNumber());
    }

    @GetMapping("/librarians")
    public Page<LibrarianListDto> allLibrarians(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.getAllLibrarians(page, size);
    }

    @GetMapping("/librarians/search")
    public Page<LibrarianListDto> searchLibrarians(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.searchLibrariansByEmployeeCode(q, page, size);
    }

    @PatchMapping("/librarians/{id}/phone")
    public LibrarianListDto updateLibrarianPhone(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePhoneDto dto,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.updateLibrarianPhone(id, dto.getPhoneNumber());
    }

}
