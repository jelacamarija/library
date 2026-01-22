package com.library.dto;

import com.library.entity.LoanStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;

@Data
@Builder
public class LoanResponseDto {

    private Long loanId;

    private Long userId;
    private String membershipNumber;
    private String userName;

    private Long bookId;
    private String bookTitle;
    private String bookAuthor;

    private Long reservationId;

    private LocalDateTime loanedAt;
    private LocalDateTime dueDate;
    private LocalDateTime returnedAt;

    private LoanStatus status;
}
