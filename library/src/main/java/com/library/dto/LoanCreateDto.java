package com.library.dto;

import lombok.Data;

@Data
public class LoanCreateDto {

    public Long find;
    private Long userId;
    private Long bookId;
    private Long reservationID;
    private int days;
}
