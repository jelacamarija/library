package com.library.dto;

import com.library.entity.PaymentMethod;
import com.library.entity.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponseDto {

    private Long paymentId;

    private Long membershipId;

    private BigDecimal amount;

    private String currency;

    private PaymentMethod paymentMethod;

    private PaymentStatus paymentStatus;

    private String paypalOrderId;

    private String paypalCaptureId;

    private LocalDateTime createdAt;

    private LocalDateTime paidAt;
}