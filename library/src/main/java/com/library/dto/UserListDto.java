package com.library.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserListDto {
    private Long userID;
    private String name;
    private String email;
    private String phoneNumber;
    private String membershipNumber;
    private Date membershipDate;
    private Boolean active;
    private Boolean isVerified;
}
