package com.library.dto;

import com.library.entity.LoanStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class LoanResponseDto {

    private Long loanId;

    private Long userId;
    private String membershipNumber;
    private String userName;

    private Long bookID;
    private String bookTitle;
    private String bookAuthor;

    private String inventoryNumber;

    private Long reservationId;

    private LocalDateTime loanedAt;
    private LocalDateTime dueDate;
    private LocalDateTime returnedAt;

    private String status;
}
