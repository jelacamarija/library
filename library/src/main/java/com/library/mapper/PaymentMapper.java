package com.library.mapper;

import com.library.dto.PaymentResponseDto;
import com.library.entity.Payment;

public class PaymentMapper {

    public static PaymentResponseDto toDto(Payment payment) {

        return PaymentResponseDto.builder()
                .paymentId(payment.getPaymentID())
                .membershipId(payment.getMembership().getMembershipID())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .paypalOrderId(payment.getPaypalOrderId())
                .paypalCaptureId(payment.getPaypalCaptureId())
                .createdAt(payment.getCreatedAt())
                .paidAt(payment.getPaidAt())
                .build();
    }
}