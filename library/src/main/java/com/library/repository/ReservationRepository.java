package com.library.repository;

import com.library.entity.Book;
import com.library.entity.Reservation;
import com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByUser(User user);
    List<Reservation> findByBook(Book book);

    Optional<Reservation> findByUserAndBookAndStatusIn(User user, Book book, List<String> statuses);

    List<Reservation> findByUser_UserID(Long userID);

    List<Reservation> findByStatusAndExpiresAtBefore(String status, Date now);

    Page<Reservation> findByUser_UserID(Long userID, Pageable pageable);

    @Query("select r from Reservation r join fetch r.book where r.user.userID = :userId")
    List<Reservation> findByUserIdWithBook(@Param("userId") Long userId);

    Optional<Reservation> findByReservationIDAndUser_UserID(Long reservationID, Long userID);
}