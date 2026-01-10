package com.library.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendVerificationEmail(String toEmail, String verificationLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Potvrda registracije");

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Dobrodošli!</h2>
                    <p>Hvala na registraciji.</p>
                    <p>Kliknite na dugme ispod kako biste potvrdili svoj nalog:</p>

                    <a href="%s"
                       style="
                         display: inline-block;
                         padding: 12px 20px;
                         margin: 20px 0;
                         background-color: #2563eb;
                         color: #ffffff;
                         text-decoration: none;
                         border-radius: 6px;
                         font-weight: bold;
                       ">
                        Potvrdi registraciju
                    </a>

                    <p>Link važi <strong>1 sat</strong>.</p>

                    <p style="font-size: 12px; color: #666;">
                        Ako dugme ne radi, kopirajte i otvorite ovaj link:<br/>
                        <a href="%s">%s</a>
                    </p>

                    <p>Srdačan pozdrav,<br/>Biblioteka tim</p>
                </div>
                """.formatted(verificationLink, verificationLink, verificationLink);

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Greška prilikom slanja verifikacionog mejla", e);
        }
    }

    public void sendSetPasswordEmail(String toEmail, String link) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Aktivacija naloga - postavite lozinku");

            String htmlContent = """
                        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                            <h2>Vaš nalog je kreiran</h2>
                            <p>Bibliotekar je kreirao nalog za Vas.</p>
                            <p>Kliknite ispod da postavite lozinku i aktivirate nalog:</p>
                    
                            <a href="%s"
                               style="
                                 display: inline-block;
                                 padding: 12px 20px;
                                 margin: 20px 0;
                                 background-color: #2563eb;
                                 color: #ffffff;
                                 text-decoration: none;
                                 border-radius: 6px;
                                 font-weight: bold;
                               ">
                                Postavi lozinku
                            </a>
                    
                            <p>Link važi <strong>1 sat</strong>.</p>
                    
                            <p style="font-size: 12px; color: #666;">
                                Ako dugme ne radi, kopirajte i otvorite ovaj link:<br/>
                                <a href="%s">%s</a>
                            </p>
                    
                            <p>Srdačan pozdrav,<br/>Biblioteka tim</p>
                        </div>
                    """.formatted(link, link, link);

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Greška prilikom slanja mejla za postavljanje lozinke", e);
        }
    }
}
