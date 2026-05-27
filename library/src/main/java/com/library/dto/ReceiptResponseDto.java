package com.library.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReceiptResponseDto {

    private Long receiptId;

    private String receiptNumber;

    private String supplier;

    private String note;

    private String librarianName;

    private LocalDateTime createdAt;

    private List<ReceiptItemResponseDto> items;
}