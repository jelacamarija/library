package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthorCreateDto {


    @NotBlank(message = "Ime autora je obavezno")
    private String name;

    private String biography;
}
