package com.library.repository;

import com.library.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment,Long> {

    Optional<Payment> findByMembershipMembershipID(Long membershipId);

    Optional<Payment> findByPaypalOrderId(String paypalOrderId);

    Optional<Payment> findByPaypalCaptureId(String paypalCaptureId);

}
