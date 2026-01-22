package com.library.service;

import com.library.dto.ReservationActiveDto;
import com.library.dto.ReservationResponseDto;
import com.library.entity.*;
import com.library.mapper.ReservationMapper;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.ReservationRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final LoanRepository loanRepository;

    @Value("${library.loan.duration-days}")
    private int loanDurationDays;

    @Transactional
    public ReservationResponseDto createReservation(Long userID, Long bookID) {

        User user = userRepository.findById(userID)
                .orElseThrow(() -> new RuntimeException("Korisnik ne postoji"));

        Book book = bookRepository.findById(bookID)
                .orElseThrow(() -> new RuntimeException("Knjiga ne postoji"));

        boolean alreadyLoaned = loanRepository.existsByUserAndBookAndStatus(user, book, LoanStatus.ACTIVE);
        if (alreadyLoaned) {
            throw new RuntimeException("Ovu knjigu već imate iznajmljenu. Ne možete je rezervisati dok je ne vratite.");
        }

        if (book.getCopiesAvailable() <= 0) {
            throw new RuntimeException("Knjiga trenutno nije dostupna za rezervaciju.");
        }

        Optional<Reservation> existing =
                reservationRepository.findByUserAndBookAndStatusIn(
                        user, book, List.of(ReservationMapper.STATUS_PENDING)
                );

        if (existing.isPresent()) {
            throw new RuntimeException("Već imate rezervaciju na čekanju za ovu knjigu.");
        }

        // rezervacija "drži" primjerak (smanjuje dostupne kopije)
        book.setCopiesAvailable(book.getCopiesAvailable() - 1);
        bookRepository.save(book);

        Reservation reservation = ReservationMapper.toEntity(user, book);
        reservationRepository.save(reservation);

        return ReservationMapper.toDto(reservation);
    }

    public List<ReservationResponseDto> getReservationsForUser(Long userID) {
        List<Reservation> reservations = reservationRepository.findByUserIdWithBook(userID);
        return reservations.stream().map(ReservationMapper::toDto).toList();
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

    @Transactional
    public ReservationResponseDto fulfillReservation(ReservationActiveDto dto) {

        Reservation reservation = reservationRepository.findById(dto.getReservationID())
                .orElseThrow(() -> new RuntimeException("Rezervacija ne postoji"));

        if (!ReservationMapper.STATUS_PENDING.equalsIgnoreCase(reservation.getStatus())) {
            throw new RuntimeException("Rezervacija se može preuzeti samo ako je na čekanju.");
        }

        Date now = new Date();

        // Ako je istekla, vraćamo kopiju i označimo expired
        if (reservation.getExpiresAt() != null && reservation.getExpiresAt().before(now)) {
            Book book = reservation.getBook();
            book.setCopiesAvailable(book.getCopiesAvailable() + 1);
            bookRepository.save(book);

            reservation.setStatus(ReservationMapper.STATUS_EXPIRED);
            reservationRepository.save(reservation);

            throw new RuntimeException("Rezervacija je istekla i ne može se preuzeti.");
        }

        boolean alreadyHasLoan =
                loanRepository.existsByUserAndBookAndStatus(
                        reservation.getUser(), reservation.getBook(), LoanStatus.ACTIVE
                );
        if (alreadyHasLoan) {
            throw new RuntimeException("Korisnik već ima aktivno iznajmljivanje za ovu knjigu.");
        }

        // rezervacija postaje fulfilled
        reservation.setStatus(ReservationMapper.STATUS_FULFILLED);
        reservation.setUsed(true);
        reservationRepository.save(reservation);

        // Loan: LocalDateTime + trajanje iz resources
        LocalDateTime loanedAt = LocalDateTime.now();
        LocalDateTime dueDate = loanedAt.plusDays(loanDurationDays);

        Loan loan = Loan.builder()
                .user(reservation.getUser())
                .book(reservation.getBook())
                .reservation(reservation)
                .loanedAt(loanedAt)
                .dueDate(dueDate)
                .status(LoanStatus.ACTIVE)
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

        // vraćamo kopiju u dostupne
        Book book = reservation.getBook();
        book.setCopiesAvailable(book.getCopiesAvailable() + 1);
        bookRepository.save(book);

        return ReservationMapper.toDto(reservation);
    }

    public Page<ReservationResponseDto> searchReservationsByMembership(String q, int page, int size, String sort) {

        if (q == null || q.trim().isEmpty()) {
            return Page.empty();
        }

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction =
                (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        Page<Reservation> reservations = reservationRepository.searchByUserMembership(q.trim(), pageable);

        return reservations.map(ReservationMapper::toDto);
    }
}
