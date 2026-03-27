package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthorCreateRequestDto {
    @NotBlank(message = "Ime je obavezno")
    private String name;

    private String biography;
}
