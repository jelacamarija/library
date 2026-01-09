package com.library.service;


import com.library.dto.UserProfileDto;
import com.library.entity.User;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileDto getMyProfile(Long userID) {
        User u = userRepository.findById(userID)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));

        return new UserProfileDto(
                u.getUserID(),
                u.getName(),
                u.getEmail(),
                u.getPhoneNumber(),
                u.getMembershipNumber(),
                u.getMembershipDate(),
                u.getIsVerified(),
                u.getActive(),
                u.getCreatedAt(),
                u.getRole()
        );
    }
}
