package com.library.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Date;

@Data
@AllArgsConstructor
public class UserProfileDto {
    private Long userID;
    private String name;
    private String email;
    private String phoneNumber;
    private String membershipNumber;
    private Date membershipDate;
    private Boolean isVerified;
    private Boolean active;
    private Date createdAt;
    private String role;

}
