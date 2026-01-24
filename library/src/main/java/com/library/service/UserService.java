package com.library.service;


import com.library.dto.UserListDto;
import com.library.dto.UserProfileDto;
import com.library.entity.User;
import com.library.mapper.UserMapper;
import com.library.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileDto getMyProfile(Long userID) {
        User u = userRepository.findById(userID)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));

        return UserMapper.toProfileDto(u);

    }

    public Page<UserListDto> getAllClients(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository
                .findByRole("CLIENT", pageable)
                .map(UserMapper::toListDto);

    }

    public Page<UserListDto> searchClientsByMembership(String q, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository
                .findByRoleAndMembershipNumberContainingIgnoreCase("CLIENT", q, pageable)
                .map(UserMapper::toListDto);

    }

    public UserListDto findClientByExactMembership(String membershipNumber) {
        User u = userRepository.findByMembershipNumber(membershipNumber)
                .orElseThrow(() -> new RuntimeException("Ne postoji korisnik sa članskom: " + membershipNumber));

        if (!"CLIENT".equalsIgnoreCase(u.getRole())) {
            throw new RuntimeException("Članski broj je predviđen samo za CLIENT naloge.");
        }

        return UserMapper.toListDto(u);
    }


    @Transactional
    public UserListDto updateUserPhone(Long userId, String phoneNumber) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));

        if (!"CLIENT".equalsIgnoreCase(u.getRole())) {
            throw new RuntimeException("Možete mijenjati podatke samo CLIENT korisnicima.");
        }

        u.setPhoneNumber(phoneNumber);
        userRepository.save(u);

        return UserMapper.toListDto(u);
    }
}
