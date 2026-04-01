package com.library.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LibrarianListDto {
    private Long userID;
    private String name;
    private String email;
    private String phoneNumber;
    private String employeeCode;

    private Boolean active;
    private Boolean isVerified;
}
