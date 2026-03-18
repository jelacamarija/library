package com.library.service;

import com.library.dto.*;
import com.library.entity.*;
import com.library.mapper.RegisterMapper;
import com.library.repository.MembershipRepository;
import com.library.repository.UserRepository;
import com.library.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.math.BigDecimal;
import java.time.LocalDateTime;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder=new BCryptPasswordEncoder();

    @Value("${app.frontend.base.url:http://localhost:4200}")
    private String frontendBaseUrl;

    @Value("${library.membership.amount}")
    private BigDecimal membershipAmount;

    @Value("${library.membership.duration-days}")
    private int membershipDurationDays;

    @Transactional
    public String registerLibrarian(RegisterRequestDto dto) {

        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Korisnik sa ovim mejlom već postoji.");
        }

        String verifyCode = UUID.randomUUID().toString();

        Librarian librarian = Librarian.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .phoneNumber(dto.getPhoneNumber())
                .isVerified(false)
                .active(true)
                .verifyCode(verifyCode)
                .verifyCodeExpiry(LocalDateTime.now().plusHours(1))
                .build();

        userRepository.save(librarian);

        String verificationLink = frontendBaseUrl + "/verify?code=" + verifyCode;
        emailService.sendVerificationEmail(librarian.getEmail(), verificationLink);

        return "Registracija bibliotekara uspešna. Proverite email.";
    }

    @Transactional
    public String registerClient(RegisterRequestDto dto, String appBaseUrl){

        if(userRepository.existsByEmail(dto.getEmail())){
            throw new RuntimeException("Korisnik sa ovim mejlom vec postoji");
        }

        String verifyCode= UUID.randomUUID().toString();

        Client client=RegisterMapper.toClientEntity(dto);
        client.setPassword(passwordEncoder.encode(dto.getPassword()));
        client.setVerifyCode(verifyCode);
        client.setVerifyCodeExpiry(LocalDateTime.now().plusHours(1));
        client.setIsVerified(false);
        client.setActive(true);
        client.setMembershipNumber(null);

        userRepository.save(client);

        Membership membership=Membership.builder()
                .client(client)
                .amount(membershipAmount)
                .status(MembershipStatus.PENDING)
                .startDate(null)
                .endDate(null)
                .build();

        membershipRepository.save(membership);

        String verificationLink = frontendBaseUrl + "/verify?code=" + verifyCode;
        emailService.sendVerificationEmail(client.getEmail(), verificationLink);
        return "Registracija uspesna! Proverite mejl da potvrdite nalog!";

    }

    private String generateMembershipNumber(Long userID) {
        return "CL" + String.format("%06d", userID);
    }

    private String generateEmployeeCode(Long userID) {
        return "LIB" + String.format("%05d", userID);
    }

    @Transactional
    public  String verifyRegistration(String code) {
        User user = userRepository.findByVerifyCode(code)
                .orElseThrow(() -> new RuntimeException("Nevažeći kod."));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new RuntimeException("Nalog je već verifikovan.");
        }


        if (user.getVerifyCodeExpiry() == null || user.getVerifyCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Link je istekao.");
        }


            user.setIsVerified(true);
            user.setVerifiedAt(LocalDateTime.now());
            user.setVerifyCode(null);
            user.setVerifyCodeExpiry(null);

            if (user instanceof Client client && client.getMembershipNumber() == null) {
                client.setMembershipNumber(generateMembershipNumber(client.getUserID()));
            }

            if (user instanceof Librarian librarian && librarian.getEmployeeCode() == null) {
                librarian.setEmployeeCode(generateEmployeeCode(librarian.getUserID()));
            }

            userRepository.save(user);

            return "Vas nalog je verifikovan! Mozete se prijaviti.";

    }

    public LoginResponseDto loginUser(LoginRequestDto request){
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED, "Pogrešan email ili lozinka."
                    ));

            if (Boolean.FALSE.equals(user.getIsVerified())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Morate da verifikujete svoj nalog. Proverite mejl.");
            }

            if (user.getPassword() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Nalog nije aktiviran. Postavite lozinku putem mejla.");
            }

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new RuntimeException("Pogrešna lozinka");
            }

            String role=resolveRole(user);

            String token = jwtUtil.generateToken(user.getUserID(),user.getEmail(), role);

            return LoginResponseDto.builder()
                    .token(token)
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(role)
                    .build();
    }

 @Transactional
public String createUserByLibrarian(LibrarianCreateUserDto dto) {
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new RuntimeException("Korisnik sa ovim mejlom već postoji.");
            }

            String verifyCode = UUID.randomUUID().toString();

            Client client = Client.builder()
                    .name(dto.getName())
                    .email(dto.getEmail())
                    .phoneNumber(dto.getPhoneNumber())
                    .password(null)
                    .isVerified(false)
                    .active(true)
                    .verifyCode(verifyCode)
                    .verifyCodeExpiry(LocalDateTime.now().plusHours(1))
                    .membershipNumber(null)
                    .build();

            userRepository.save(client);

            Membership membership = Membership.builder()
                    .client(client)
                    .amount(membershipAmount)
                    .status(MembershipStatus.PENDING)
                    .startDate(null)
                    .endDate(null)
                    .build();

            membershipRepository.save(membership);

            String link = frontendBaseUrl + "/set-password?code=" + verifyCode;
            emailService.sendSetPasswordEmail(client.getEmail(), link);

            return "Korisnik kreiran. Poslat mejl za postavljanje lozinke.";
        }


@Transactional
public String setPasswordAndVerify(SetPasswordDto dto) {
            User user = userRepository.findByVerifyCode(dto.getCode())
                    .orElseThrow(() -> new RuntimeException("Nevažeći kod."));

            if (user.getVerifyCodeExpiry() == null || user.getVerifyCodeExpiry().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Link je istekao.");
            }

            user.setPassword(passwordEncoder.encode(dto.getPassword()));
            user.setIsVerified(true);
            user.setVerifiedAt(LocalDateTime.now());
            user.setVerifyCode(null);
            user.setVerifyCodeExpiry(null);

            if (user instanceof Client client && client.getMembershipNumber() == null) {
                client.setMembershipNumber(generateMembershipNumber(client.getUserID()));
            }

            if (user instanceof Librarian librarian && librarian.getEmployeeCode() == null) {
                librarian.setEmployeeCode(generateEmployeeCode(librarian.getUserID()));
            }

            userRepository.save(user);

            return "Lozinka postavljena. Nalog je aktiviran.";
        }

    @Transactional
    public String createLibrarianByLibrarian(LibrarianCreateUserDto dto) {

        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Korisnik sa ovim mejlom već postoji.");
        }

        String verifyCode = UUID.randomUUID().toString();

        Librarian librarian = Librarian.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phoneNumber(dto.getPhoneNumber())
                .password(null)
                .isVerified(false)
                .active(true)
                .verifyCode(verifyCode)
                .verifyCodeExpiry(LocalDateTime.now().plusHours(1))
                .employeeCode(null)
                .build();

        userRepository.save(librarian);

        String link = frontendBaseUrl + "/set-password?code=" + verifyCode;
        emailService.sendSetPasswordEmail(librarian.getEmail(), link);

        return "Bibliotekar kreiran. Poslat mejl za postavljanje lozinke.";
    }


    private String resolveRole(User user) {
        if (user instanceof Client) {
            return "CLIENT";
        }
        if (user instanceof Librarian) {
            return "LIBRARIAN";
        }
        throw new RuntimeException("Nepoznat tip korisnika.");
    }
}
