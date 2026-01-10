package com.library.service;

import com.library.dto.ReservationActiveDto;
import com.library.dto.ReservationResponseDto;
import com.library.entity.Book;
import com.library.entity.Loan;
import com.library.entity.Reservation;
import com.library.entity.User;
import com.library.mapper.ReservationMapper;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.ReservationRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final LoanRepository loanRepository;

    @Transactional
    public ReservationResponseDto createReservation(Long userID, Long bookID){

        User user = userRepository.findById(userID)
                .orElseThrow(() -> new RuntimeException("Korisnik ne postoji"));

        Book book = bookRepository.findById(bookID)
                .orElseThrow(() -> new RuntimeException("Knjiga ne postoji"));

        if (book.getCopiesAvailable() <= 0) {
            throw new RuntimeException("Knjiga trenutno nije dostupna za rezervaciju");
        }


        Optional<Reservation> existing =
                reservationRepository.findByUserAndBookAndStatusIn(
                        user, book, List.of(ReservationMapper.STATUS_PENDING, ReservationMapper.STATUS_ACTIVE)
                );

        if (existing.isPresent()) {
            throw new RuntimeException("Već imate rezervaciju za ovu knjigu (na čekanju ili aktivnu).");
        }

        book.setCopiesAvailable(book.getCopiesAvailable() - 1);
        bookRepository.save(book);

        Reservation reservation = ReservationMapper.toEntity(user, book);
        reservationRepository.save(reservation);

        return ReservationMapper.toDto(reservation);
    }

    public List<ReservationResponseDto> getReservationsForUser(Long userID) {
        List<Reservation> reservations = reservationRepository.findByUserIdWithBook(userID);
        return reservations.stream()
                .map(ReservationMapper::toDto)
                .toList();
    }

    public Page<ReservationResponseDto> getAllReservations(int page, int size, String sort) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction =
                (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<Reservation> reservationPage = reservationRepository.findAll(pageable);
        return reservationPage.map(ReservationMapper::toDto);
    }

    public Page<ReservationResponseDto> getReservationsForUserLibrarian(Long userID, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Reservation> reservations = reservationRepository.findByUser_UserID(userID, pageable);
        return reservations.map(ReservationMapper::toDto);
    }

    public ReservationResponseDto activateReservation(ReservationActiveDto dto){

        Reservation reservation = reservationRepository.findById(dto.getReservationID())
                .orElseThrow(() -> new RuntimeException("Rezervacija ne postoji"));

        if (!ReservationMapper.STATUS_PENDING.equalsIgnoreCase(reservation.getStatus())) {
            throw new RuntimeException("Rezervacija nije na čekanju (možda je aktivirana, istekla ili otkazana).");
        }

        // aktiviranje rezervacije
        reservation.setStatus(ReservationMapper.STATUS_ACTIVE);
        reservation.setUsed(true);
        reservation.setExpiresAt(null); // više nema roka isteka
        reservationRepository.save(reservation);

        // kreiranje loan jer je rez preuzeta
        Book book = reservation.getBook();
        User user = reservation.getUser();

        Date now = new Date();
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(now);
        calendar.add(Calendar.DAY_OF_MONTH, dto.getDays());
        Date dueDate = calendar.getTime();

        Loan loan = Loan.builder()
                .user(user)
                .book(book)
                .reservation(reservation)
                .loanedAt(now)
                .dueDate(dueDate)
                .status("ACTIVE")
                .build();

        loanRepository.save(loan);

        return ReservationMapper.toDto(reservation);
    }

    @Transactional
    public ReservationResponseDto cancelReservation(Long userID, Long reservationID) {

        Reservation reservation = reservationRepository
                .findByReservationIDAndUser_UserID(reservationID, userID)
                .orElseThrow(() -> new RuntimeException("Rezervacija ne postoji"));

        if (!ReservationMapper.STATUS_PENDING.equalsIgnoreCase(reservation.getStatus())) {
            throw new RuntimeException("Možeš otkazati samo rezervaciju koja je na čekanju.");
        }

        reservation.setStatus(ReservationMapper.STATUS_CANCELED);
        reservationRepository.save(reservation);

        Book book = reservation.getBook();
        book.setCopiesAvailable(book.getCopiesAvailable() + 1);
        bookRepository.save(book);

        return ReservationMapper.toDto(reservation);
    }
}