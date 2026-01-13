package com.library.mapper;

import com.library.dto.LoanResponseDto;
import com.library.entity.Loan;

public class LoanMapper {

    public static LoanResponseDto toDto(Loan loan) {
        return LoanResponseDto.builder()
                .loanId(loan.getLoanId())
                .userId(loan.getUser().getUserID())
                .membershipNumber(loan.getUser().getMembershipNumber())
                .userName(loan.getUser().getName())
                .bookId(loan.getBook().getBookID())
                .bookTitle(loan.getBook().getTitle())
                .bookAuthor(loan.getBook().getAuthor())
                .reservationId(
                        loan.getReservation() != null
                                ? loan.getReservation().getReservationID()
                                : null
                )
                .loanedAt(loan.getLoanedAt())
                .dueDate(loan.getDueDate())
                .returnedAt(loan.getReturnedAt())
                .status(loan.getStatus())
                .build();
    }

    public static Loan toEntity() {
        return Loan.builder().build();
    }
}
