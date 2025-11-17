package com.library.mapper;

import com.library.dto.ReservationResponseDto;
import com.library.entity.Book;
import com.library.entity.Reservation;
import com.library.entity.User;

public class ReservationMapper {
    public static ReservationResponseDto toDto(Reservation reservation) {
        return ReservationResponseDto.builder()
                .reservationID(reservation.getReservationID())
                .userID(reservation.getUser().getUserID())
                .bookID(reservation.getBook().getBookID())
                .bookTitle(reservation.getBook().getTitle())
                .reservedAt(reservation.getReservedAt())
                .expiresAt(reservation.getExpiresAt())
                .status(reservation.getStatus())
                .build();
    }

    // Entity za kreiranje rezervacije
    public static Reservation toEntity(User user, Book book) {
        return Reservation.builder()
                .user(user)
                .book(book)
                .build();
    }

}
