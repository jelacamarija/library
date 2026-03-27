package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PublicationCreateRequestDto {

    private Long bookId;

    @NotBlank
    private String isbn;

    private String publisher;
    private Integer publishedYear;
    private String edition;
    private String language;
}
