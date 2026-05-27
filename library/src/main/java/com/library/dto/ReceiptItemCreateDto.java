package com.library.dto;

import lombok.Data;

@Data
public class ReceiptItemCreateDto {

    private Long publicationId;

    private Integer quantity;

    private String location;
}