package com.library.service;


import com.library.dto.UserListDto;
import com.library.dto.ClientProfileDto;
import com.library.entity.Client;
import com.library.entity.Membership;
import com.library.entity.User;
import com.library.mapper.ClientMapper;
import com.library.repository.ClientRepository;
import com.library.repository.MembershipRepository;
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
    private final ClientRepository clientRepository;
    private final MembershipRepository membershipRepository;

    public ClientProfileDto getMyProfile(Long userID) {
        Client client=clientRepository.findById(userID).orElseThrow(
                () -> new RuntimeException("Klijent nije pronađen")
        );

        Membership membership=membershipRepository.findFirstByClientOrderByCreatedAtDesc(client).orElse(null);

        return ClientMapper.toProfileDto(client, membership);

    }

    public Page<UserListDto> getAllClients(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return clientRepository.findAll(pageable)
                .map(client -> {
                    Membership membership=membershipRepository
                            .findFirstByClientOrderByCreatedAtDesc(client)
                            .orElse(null);
                    return ClientMapper.toListDto(client,membership);
                });

    }

    public Page<UserListDto> searchClientsByMembership(String q, int page, int size) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return clientRepository.findByMembershipNumberContainingIgnoreCase(q, pageable)
                .map(client -> {
                    Membership membership = membershipRepository
                            .findFirstByClientOrderByCreatedAtDesc(client)
                            .orElse(null);

                    return ClientMapper.toListDto(client, membership);
                });
    }

    public UserListDto findClientByExactMembership(String membershipNumber) {

        Client client = clientRepository.findByMembershipNumber(membershipNumber)
                .orElseThrow(() ->
                        new RuntimeException("Ne postoji korisnik sa članskom: " + membershipNumber)
                );

        Membership membership = membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client)
                .orElse(null);

        return ClientMapper.toListDto(client, membership);
    }


    @Transactional
    public UserListDto updateUserPhone(Long userId, String phoneNumber) {

        Client client = clientRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Klijent nije pronađen."));

        client.setPhoneNumber(phoneNumber);
        clientRepository.save(client);

        Membership membership = membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client)
                .orElse(null);

        return ClientMapper.toListDto(client, membership);
    }
}
