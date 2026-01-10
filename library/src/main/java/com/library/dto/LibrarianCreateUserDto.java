package com.library.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LibrarianCreateUserDto {
    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    private String phoneNumber;
}