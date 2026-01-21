package com.library.controller;


import com.library.dto.LibrarianCreateUserDto;
import com.library.dto.UpdatePhoneDto;
import com.library.dto.UserListDto;
import com.library.dto.UserProfileDto;
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
    public UserProfileDto me(HttpServletRequest request) {
        Long userID = (Long) request.getAttribute("userId");
        if (userID == null) throw new RuntimeException("Niste ulogovani");
        return userService.getMyProfile(userID);
    }

    @GetMapping("/clients")
    public Page<UserListDto> allClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.getAllClients(page, size);
    }

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

    @PostMapping("/create")
    public String createUser(@Valid @RequestBody LibrarianCreateUserDto dto,
                             HttpServletRequest request) {
        requireLibrarian(request);
        return authService.createUserByLibrarian(dto);
    }

    @PatchMapping("/{id}/phone")
    public UserListDto updatePhone(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePhoneDto dto,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return userService.updateUserPhone(id, dto.getPhoneNumber());
    }

}
