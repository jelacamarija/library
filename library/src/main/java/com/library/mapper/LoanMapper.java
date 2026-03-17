package com.library.mapper;

import com.library.dto.LoanResponseDto;
import com.library.entity.Client;
import com.library.entity.Loan;
import com.library.entity.User;

public class LoanMapper {

    private LoanMapper() {
    }

    public static LoanResponseDto toDto(Loan loan) {

        User user = loan.getUser();

        return LoanResponseDto.builder()
                .loanId(loan.getLoanId())
                .userId(user.getUserID())
                .membershipNumber(extractMembershipNumber(user))
                .userName(user.getName())
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


    private static String extractMembershipNumber(User user) {
        if (user instanceof Client client) {
            return client.getMembershipNumber();
        }
        return null;
    }

    public static Loan toEntity() {
        return Loan.builder().build();
    }
}