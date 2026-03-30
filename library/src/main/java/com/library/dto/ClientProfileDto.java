package com.library.dto;


import com.library.entity.MembershipStatus;
import lombok.AllArgsConstructor;
import lombok.Data;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;


@Data
@AllArgsConstructor
public class ClientProfileDto {

    private Long userID;
    private String name;
    private String email;
    private String phoneNumber;
    private String membershipNumber;

    private Boolean isVerified;
    private Boolean active;
    private LocalDateTime createdAt;


    private MembershipStatus membershipStatus;
    private BigDecimal membershipAmount;
    private LocalDate membershipStartDate;
    private LocalDate membershipEndDate;
}
