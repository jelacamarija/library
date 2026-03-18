package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MembershipCashPaymentDto {
    @NotBlank
    private String membershipNumber;
}
