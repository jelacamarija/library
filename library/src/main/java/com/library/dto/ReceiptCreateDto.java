package com.library.dto;

import lombok.Data;

import java.util.List;

@Data
public class ReceiptCreateDto {

    private String supplier;

    private String note;

    private List<ReceiptItemCreateDto> items;
}