package com.library.mapper;

import com.library.dto.ReservationResponseDto;
import com.library.entity.Book;
import com.library.entity.Client;
import com.library.entity.Reservation;
import com.library.entity.User;

import java.util.Date;

public class ReservationMapper {

    public static ReservationResponseDto toDto(Reservation reservation) {

        var instance = reservation.getBookInstance();
        var publication = instance.getPublication();
        var book = publication.getBook();
        var user = reservation.getUser();
        return ReservationResponseDto.builder()
                .reservationID(reservation.getReservationID())
                .userID(user.getUserID())
                .userName(user.getName())
                .membershipNumber(extractMembershipNumber(user))
                .bookID(book.getBookID())
                .bookTitle(book.getTitle())
                .bookAuthor(
                        book.getAuthors().stream()
                                .map(a -> a.getName())
                                .reduce((a, b) -> a + ", " + b)
                                .orElse("")
                )
                .inventoryNumber(instance.getInventoryNumber())
                .reservedAt(reservation.getReservedAt())
                .expiresAt(reservation.getExpiresAt())
                .status(reservation.getStatus().name())
                .loanID(
                        reservation.getLoan() != null
                                ? reservation.getLoan().getLoanId()
                                : null
                )
                .build();
    }

    private static String extractMembershipNumber(User user) {
        if (user instanceof Client client) {
            return client.getMembershipNumber();
        }
        return null;
    }
}