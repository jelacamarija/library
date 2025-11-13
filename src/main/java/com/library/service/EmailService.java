package com.library.service;

import lombok.RequiredArgsConstructor;
import lombok.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;




    public void sendVerificationEmail(String toEmail, String verificationLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Potvrda registracije");
        message.setText("Pozdrav!\n\nKliknite na sledeći link da potvrdite registraciju:\n"
                + verificationLink +
                "\n\nLink važi 1 sat.\n\nHvala!");
        mailSender.send(message);
    }
}
