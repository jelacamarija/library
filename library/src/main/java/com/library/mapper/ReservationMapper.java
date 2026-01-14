package com.library.mapper;

import com.library.dto.ReservationResponseDto;
import com.library.entity.Book;
import com.library.entity.Reservation;
import com.library.entity.User;

import java.util.Date;

public class ReservationMapper {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_FULFILLED = "FULFILLED";
    public static final String STATUS_EXPIRED = "EXPIRED";
    public static final String STATUS_CANCELED = "CANCELED";

    public static ReservationResponseDto toDto(Reservation reservation) {
        return ReservationResponseDto.builder()
                .reservationID(reservation.getReservationID())
                .userID(reservation.getUser().getUserID())
                .userName(reservation.getUser().getName())
                .membershipNumber(reservation.getUser().getMembershipNumber())
                .bookID(reservation.getBook().getBookID())
                .bookTitle(reservation.getBook().getTitle())
                .bookAuthor(reservation.getBook().getAuthor())
                .reservedAt(reservation.getReservedAt())
                .expiresAt(reservation.getExpiresAt())
                .status(reservation.getStatus())
                .loanID(reservation.getLoan() != null ? reservation.getLoan().getLoanId() : null)
                .build();
    }

    public static Reservation toEntity(User user, Book book) {
        return Reservation.builder()
                .user(user)
                .book(book)
                .reservedAt(new Date())
                .expiresAt(new Date(System.currentTimeMillis() + 3L * 24 * 60 * 60 * 1000)) // 3 dana
                .status(STATUS_PENDING)
                .used(false)
                .build();
    }
}