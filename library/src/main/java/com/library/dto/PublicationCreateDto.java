package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PublicationCreateDto {

    @NotNull
    private Long bookId;

    @Pattern(regexp = "\\d{13}", message = "ISBN mora imati tačno 13 cifara")
    private String isbn;

    @NotBlank
    private String publisher;

    @NotNull
    private Integer publishedYear;

    @NotBlank
    private String edition;

    @NotBlank
    private String language;
}
