package com.library.service;

import com.library.entity.*;
import com.library.repository.ClientRepository;
import com.library.repository.MembershipRepository;
import com.library.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final ClientRepository clientRepository;
    private final PaymentRepository paymentRepository;

    @Value("${library.membership.duration-days}")
    private int membershipDurationDays;

    @Transactional
    public String activateMembershipCash(String membershipNumber) {

        membershipNumber = membershipNumber.trim();

         Client client = clientRepository.findByMembershipNumber(membershipNumber)
                .orElseThrow(() -> new RuntimeException("Ne postoji korisnik sa ovom članskom kartom."));


        if (Boolean.FALSE.equals(client.getIsVerified())) {
            throw new RuntimeException("Korisnik mora biti verifikovan.");
        }

        Membership membership = membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client)
                .orElseThrow(() -> new RuntimeException("Članarina ne postoji."));

        if (membership.getStatus() == MembershipStatus.ACTIVE) {
            throw new RuntimeException("Članarina je već aktivna.");
        }

        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(membershipDurationDays);

        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setStartDate(start);
        membership.setEndDate(end);

        membershipRepository.save(membership);

        Payment payment = Payment.builder()
                .membership(membership)
                .amount(membership.getAmount())
                .paymentMethod(PaymentMethod.CASH)
                .paymentStatus(PaymentStatus.COMPLETED)
                .paidAt(LocalDateTime.now())
                .note("Plaćanje u kešu evidentirao bibliotekar")
                .build();

        paymentRepository.save(payment);

        return "Članarina uspešno aktivirana.";
    }
}