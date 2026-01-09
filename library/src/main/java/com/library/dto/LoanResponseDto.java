package com.library.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Date;

@Data
@Builder
public class LoanResponseDto {

    private Long loanId;

    private Long userId;

    private Long bookId;
    private String bookTitle;
    private String bookAuthor;

    private Long reservationId;

    private Date loanedAt;
    private Date dueDate;
    private Date returnedAt;

    private String status;
}
