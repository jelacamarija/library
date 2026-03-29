package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookInstanceCreateDto {

    @NotNull
    private Long publicationId;

    @NotBlank
    private String inventoryNumber;

    @NotBlank
    private String location;
}
