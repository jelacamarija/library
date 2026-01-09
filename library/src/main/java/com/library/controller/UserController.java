package com.library.controller;


import com.library.dto.UserProfileDto;
import com.library.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserProfileDto me(HttpServletRequest request) {
        Long userID = (Long) request.getAttribute("userId");

        if (userID == null) {
            throw new RuntimeException("Niste ulogovani");
        }

        return userService.getMyProfile(userID);
    }
}
