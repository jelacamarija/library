package com.library.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BookCreateRequestDto {

    @NotBlank(message = "Naslov je obavezan")
    private String title;

    @NotBlank(message = "Autor je obavezan")
    private String author;

    @NotBlank(message = "ISBN je obavezan")
    @Pattern(regexp = "^\\d{13}$", message = "ISBN mora imati tačno 13 cifara")
    private String isbn;

    private String description;

    @NotBlank(message = "Kategorija je obavezna")
    private String category;

    @NotNull(message = "Godina izdanja je obavezna")
    private Integer publishedYear;

    @NotNull(message = "Ukupan broj kopija je obavezan")
    @Min(value = 1, message = "Ukupan broj kopija mora biti najmanje 1")
    private Integer copiesTotal;
}
