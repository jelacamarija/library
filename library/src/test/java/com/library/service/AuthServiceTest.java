package com.library.service;

import com.library.dto.LibrarianCreateUserDto;
import com.library.entity.Client;
import com.library.entity.Membership;
import com.library.entity.MembershipStatus;
import com.library.repository.MembershipRepository;
import com.library.repository.UserRepository;
import com.library.utils.JwtUtil;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(
                authService,
                "frontendBaseUrl",
                "http://localhost:4200"
        );

        ReflectionTestUtils.setField(
                authService,
                "membershipAmount",
                new BigDecimal("20.00")
        );
    }

    @Test
    void createUserByLibrarian_shouldCreateUserSuccessfully() {

        // ARRANGE
        LibrarianCreateUserDto dto = new LibrarianCreateUserDto();
        dto.setName("Vera Maglov");
        dto.setEmail("veramaglov25@gmail.com");
        dto.setPhoneNumber("061123456");

        when(userRepository.existsByEmail(dto.getEmail()))
                .thenReturn(false);

        // ACT
        String result = authService.createUserByLibrarian(dto);

        // ASSERT
        assertEquals(
                "Korisnik kreiran. Poslat mejl za postavljanje lozinke.",
                result
        );

        verify(userRepository, times(1))
                .save(any(Client.class));

        verify(membershipRepository, times(1))
                .save(any(Membership.class));

        verify(emailService, times(1))
                .sendSetPasswordEmail(
                        eq("veramaglov25@gmail.com"),
                        anyString()
                );
    }

    @Test
    void createUserByLibrarian_emailAlreadyExists_throwsException() {

        // ARRANGE
        LibrarianCreateUserDto dto = new LibrarianCreateUserDto();
        dto.setName("Vera Maglov");
        dto.setEmail("veramaglov25@gmail.com");
        dto.setPhoneNumber("061123456");

        when(userRepository.existsByEmail(dto.getEmail()))
                .thenReturn(true);

        // ACT
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> authService.createUserByLibrarian(dto)
        );

        // ASSERT
        assertNotNull(exception);

        verify(userRepository, never())
                .save(any(Client.class));

        verify(membershipRepository, never())
                .save(any(Membership.class));

        verify(emailService, never())
                .sendSetPasswordEmail(anyString(), anyString());
    }
}