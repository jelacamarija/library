package com.library.service;

import com.library.dto.*;
import com.library.entity.User;
import com.library.mapper.RegisterMapper;
import com.library.repository.UserRepository;
import com.library.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
     private final UserRepository userRepository;
     private final EmailService emailService;
     private final JwtUtil jwtUtil;
     private final BCryptPasswordEncoder passwordEncoder=new BCryptPasswordEncoder();

     @Value("${app.frontend.base.url:http://localhost:4200}")
     private String frontendBaseUrl;


     public String registerUser(RegisterRequestDto dto, String appBaseUrl){
         Optional<User> existing=userRepository.findByEmail(dto.getEmail());
         if(existing.isPresent()){
             throw new RuntimeException("Korisnik sa ovim mejlom vec postoji");
         }


         String verifyCode= UUID.randomUUID().toString();

         User user= RegisterMapper.toEntity(dto);
         user.setPassword(passwordEncoder.encode(dto.getPassword()));
         user.setVerifyCode(verifyCode);
         user.setVerifyCodeExpiry(new Date(System.currentTimeMillis() + 1000 * 60 * 60));
         user.setIsVerified(false);
         user.setRole("CLIENT");

         user.setMembershipDate(new Date());



         userRepository.save(user);

         user.setMembershipNumber(generateMembershipNumber(user.getUserID()));
         userRepository.save(user);
         String verificationLink = frontendBaseUrl + "/verify?code=" + verifyCode;
         emailService.sendVerificationEmail(user.getEmail(), verificationLink);
         return "Registracija uspesna! Proverite mejl da potvrdite nalog!";


     }

    private String generateMembershipNumber(Long userID) {
         return "LIB" + String.format("%06d", userID);
    }

    public  String verifyRegistration(String code){
         Optional<User> optionalUser = userRepository.findByVerifyCode(code);

         if (optionalUser.isEmpty()) {
             return "Nevažeći verifikacioni kod.";
         }

         User user=optionalUser.get();

         if (user.getVerifyCodeExpiry().before(new Date())) {
             return "Verifikacioni link je istekao.";
         }
         user.setIsVerified(true);
         user.setVerifyCode(null);
         user.setVerifyCodeExpiry(null);
         userRepository.save(user);

         return "Vaš nalog je uspešno verifikovan!";


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

         String token = jwtUtil.generateToken(user.getUserID(),user.getEmail(), user.getRole());

         return LoginResponseDto.builder()
                 .token(token)
                 .name(user.getName())
                 .email(user.getEmail())
                 .role(user.getRole())
                 .build();
     }

    @Transactional
    public String createUserByLibrarian(LibrarianCreateUserDto dto) {
        Optional<User> existing=userRepository.findByEmail(dto.getEmail());
        if(existing.isPresent()){
            throw new RuntimeException("Korisnik sa ovim mejlom vec postoji");
        }
        String verifyCode = UUID.randomUUID().toString();

        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phoneNumber(dto.getPhoneNumber())
                .role("CLIENT")
                .isVerified(false)
                .active(true)
                .verifyCode(verifyCode)
                .verifyCodeExpiry(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .membershipDate(new Date())
                .build();

        user.setPassword(null);

        userRepository.save(user);

        user.setMembershipNumber(generateMembershipNumber(user.getUserID()));
        userRepository.save(user);

        String link = frontendBaseUrl + "/set-password?code=" + verifyCode;
        emailService.sendSetPasswordEmail(user.getEmail(), link);

        return "Korisnik kreiran. Poslat mejl za postavljanje lozinke.";
    }

    @Transactional
    public String setPasswordAndVerify(SetPasswordDto dto) {
        User user = userRepository.findByVerifyCode(dto.getCode())
                .orElseThrow(() -> new RuntimeException("Nevažeći kod."));

        if (user.getVerifyCodeExpiry() == null || user.getVerifyCodeExpiry().before(new Date())) {
            throw new RuntimeException("Link je istekao.");
        }

        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setIsVerified(true);

        user.setVerifyCode(null);
        user.setVerifyCodeExpiry(null);

        userRepository.save(user);

        return "Lozinka postavljena. Nalog je aktiviran.";
    }
}
