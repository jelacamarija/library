package com.library.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class BookCreateRequestDto {

    @NotBlank(message = "Naslov je obavezan")
    private String title;

    private String description;

    @NotBlank(message = "Kategorija je obavezna")
    private String category;

    @NotEmpty(message = "Autori su obavezni")
    private List<Long> authorIds;
}
