package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SetPasswordDto {
    @NotBlank
    private String code;

    @NotBlank
    private String password;
}