package com.library.mapper;

import com.library.dto.LoanResponseDto;
import com.library.entity.Client;
import com.library.entity.Loan;
import com.library.entity.User;

public class LoanMapper {

    private LoanMapper() {}

    public static LoanResponseDto toDto(Loan loan) {

        User user = loan.getUser();
        var instance = loan.getBookInstance();
        var publication = instance.getPublication();
        var book = publication.getBook();
        return LoanResponseDto.builder()
                .loanId(loan.getLoanId())
                .userId(user.getUserID())
                .membershipNumber(extractMembershipNumber(user))
                .userName(user.getName())
                .bookID(book.getBookID())
                .bookTitle(book.getTitle())
                .bookAuthor(
                        String.join(", ",
                                book.getAuthors().stream()
                                        .map(a -> a.getName())
                                        .toList()
                        )
                )
                .inventoryNumber(instance.getInventoryNumber())
                .reservationId(
                        loan.getReservation() != null
                                ? loan.getReservation().getReservationID()
                                : null
                )
                .loanedAt(loan.getLoanedAt())
                .dueDate(loan.getDueDate())
                .returnedAt(loan.getReturnedAt())
                .status(loan.getStatus().name())
                .build();
    }

    private static String extractMembershipNumber(User user) {
        if (user instanceof Client client) {
            return client.getMembershipNumber();
        }
        return null;
    }
}