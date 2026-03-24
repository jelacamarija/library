package com.library.dto;

import com.library.entity.MembershipStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipResponseDto {

    private Long membershipId;

    private BigDecimal amount;

    private String currency;

    private MembershipStatus status;

    private LocalDate startDate;

    private LocalDate endDate;

    private LocalDateTime createdAt;
}