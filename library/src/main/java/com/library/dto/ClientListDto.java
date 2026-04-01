package com.library.dto;

import com.library.entity.MembershipStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientListDto {

    private Long userID;
    private String name;
    private String email;
    private String phoneNumber;
    private String membershipNumber;

    private MembershipStatus membershipStatus;

    private Boolean active;
    private Boolean isVerified;
}