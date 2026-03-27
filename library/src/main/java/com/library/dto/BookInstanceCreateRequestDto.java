package com.library.dto;

import lombok.Data;

@Data
public class BookInstanceCreateRequestDto {

    private Long publicationId;
    private String inventoryNumber;
    private String location;
}
