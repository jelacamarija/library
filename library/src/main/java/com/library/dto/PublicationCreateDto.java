package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PublicationCreateDto {

    @NotNull
    private Long bookId;

    @NotBlank
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
