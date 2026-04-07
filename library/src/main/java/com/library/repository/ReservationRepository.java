package com.library.repository;

import com.library.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByUser(User user);

    Optional<Reservation> findByUserAndBookInstanceAndStatus(User user, BookInstance instance, ReservationStatus status);

    List<Reservation> findByUser_UserID(Long userID);

    List<Reservation> findByStatusAndExpiresAtBefore(ReservationStatus status, Date now);

    Page<Reservation> findByUser_UserID(Long userID, Pageable pageable);

    Optional<Reservation> findByReservationIDAndUser_UserID(Long reservationID, Long userID);

    @Query("""
    SELECT r FROM Reservation r
        JOIN FETCH r.bookInstance bi
        JOIN FETCH bi.publication p
        JOIN FETCH p.book b
        WHERE r.user.userID = :userId
    """)
    List<Reservation> findByUserIdWithInstance(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {
            "user",
            "bookInstance",
            "bookInstance.publication",
            "bookInstance.publication.book",
            "loan"
    })
    Page<Reservation> findAll(Pageable pageable);

    @Query("""
        SELECT r FROM Reservation r
        JOIN FETCH r.user u
        JOIN FETCH r.bookInstance bi
        JOIN FETCH bi.publication p
        JOIN FETCH p.book b
        WHERE LOWER(u.membershipNumber) LIKE LOWER(CONCAT('%', :q, '%'))
    """)
    Page<Reservation> searchByUserMembership(@Param("q") String q, Pageable pageable);

    Optional<Reservation> findTopByUserAndBookInstanceAndStatusOrderByReservedAtDesc(
            User user, BookInstance instance, ReservationStatus status
    );

    boolean existsByUser_UserIDAndBookInstance_Publication_Book_BookIDAndStatus(Long userId, Long bookId, ReservationStatus reservationStatus);

    boolean existsByUserAndBookInstance_Publication_BookAndStatusAndBookInstanceNot(User user, Book book, ReservationStatus reservationStatus, BookInstance instance);
}