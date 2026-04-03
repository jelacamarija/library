package com.library.mapper;

import com.library.dto.ReservationResponseDto;
import com.library.entity.Book;
import com.library.entity.Client;
import com.library.entity.Reservation;
import com.library.entity.User;

import java.util.Date;
import java.util.stream.Collectors;

public class ReservationMapper {

    public static ReservationResponseDto toDto(Reservation r) {
        return ReservationResponseDto.builder()
                .reservationID(r.getReservationID())
                .userID(r.getUser().getUserID())
                .userName(r.getUser().getName())
                .membershipNumber(r.getUser() instanceof Client c ? c.getMembershipNumber() : null)
                .bookID(r.getBookInstance().getPublication().getBook().getBookID())
                .bookTitle(r.getBookInstance().getPublication().getBook().getTitle())
                .bookAuthor(
                        r.getBookInstance().getPublication().getBook()
                                .getAuthors().stream()
                                .map(a -> a.getName())
                                .collect(Collectors.joining(", "))
                )
                .isbn(r.getBookInstance().getPublication().getIsbn())
                .inventoryNumber(r.getBookInstance().getInventoryNumber())
                .location(r.getBookInstance().getLocation())
                .reservedAt(r.getReservedAt())
                .expiresAt(r.getExpiresAt())
                .status(r.getStatus().name())
                .loanID(r.getLoan() != null ? r.getLoan().getLoanId() : null)
                .build();
    }

    private static String extractMembershipNumber(User user) {
        if (user instanceof Client client) {
            return client.getMembershipNumber();
        }
        return null;
    }
}