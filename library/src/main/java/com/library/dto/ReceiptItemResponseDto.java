package com.library.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReceiptItemResponseDto {

    private Long itemId;

    private Long publicationId;

    private String isbn;

    private String bookTitle;

    private Integer quantity;

    private String location;
}