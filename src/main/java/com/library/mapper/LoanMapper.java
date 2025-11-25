package com.library.mapper;

import com.library.dto.LoanResponseDto;
import com.library.entity.Loan;

public class LoanMapper {

    public static LoanResponseDto toDto(Loan loan) {
        return LoanResponseDto.builder()
                .loanId(loan.getLoanId())
                .userId(loan.getUser().getUserID())
                .bookId(loan.getBook().getBookID())
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
