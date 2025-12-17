package com.library.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReservationResponseDto {

    private Long reservationID;
    private Long userID;
    private Long bookID;
    private String bookTitle;
    private Date reservedAt;
    private Date expiresAt;
    private String status;
    private Long loanID;
}
