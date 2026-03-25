package com.library.service;

import com.library.dto.ReservationActiveDto;
import com.library.dto.ReservationResponseDto;
import com.library.entity.*;
import com.library.mapper.ReservationMapper;
import com.library.repository.*;
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
    private final MembershipRepository membershipRepository;
    private final BookInstanceRepository bookInstanceRepository;

    @Value("${library.loan.duration-days}")
    private int loanDurationDays;

    @Transactional
    public ReservationResponseDto createReservation(Long userID, Long bookID) {

        User user = userRepository.findById(userID)
                .orElseThrow(() -> new RuntimeException("Korisnik ne postoji"));

        if (!(user instanceof Client client)) {
            throw new RuntimeException("Samo klijent može rezervisati");
        }

        Membership membership = membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client)
                .orElseThrow(() -> new RuntimeException("Članarina ne postoji"));

        if (membership.getStatus() != MembershipStatus.ACTIVE) {
            throw new RuntimeException("Morate imati aktivnu članarinu.");
        }

        Book book = bookRepository.findById(bookID)
                .orElseThrow(() -> new RuntimeException("Knjiga ne postoji"));

        boolean alreadyLoaned =
                loanRepository.existsByUserAndBookAndStatus(user, book, LoanStatus.ACTIVE);

        if (alreadyLoaned) {
            throw new RuntimeException("Već imate ovu knjigu.");
        }

        BookInstance instance = bookInstanceRepository
                .findFirstByPublication_BookAndStatus(book, BookStatus.AVAILABLE)
                .orElseThrow(() -> new RuntimeException("Nema dostupnih primjeraka"));

        Optional<Reservation> existing =
                reservationRepository.findByUserAndBookAndStatusIn(
                        user, book, List.of(ReservationMapper.STATUS_PENDING)
                );

        if (existing.isPresent()) {
            throw new RuntimeException("Već imate rezervaciju.");
        }

        instance.setStatus(BookStatus.RESERVED);
        bookInstanceRepository.save(instance);

        Reservation reservation = ReservationMapper.toEntity(user, book);
        reservation.setBookInstance(instance);

        reservationRepository.save(reservation);

        return ReservationMapper.toDto(reservation);
    }

    public List<ReservationResponseDto> getReservationsForUser(Long userID) {

        return reservationRepository.findByUserIdWithBook(userID)
                .stream()
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

        return reservationRepository.findAll(pageable)
                .map(ReservationMapper::toDto);
    }

    public Page<ReservationResponseDto> getReservationsForUserLibrarian(
            Long userID, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        return reservationRepository.findByUser_UserID(userID, pageable)
                .map(ReservationMapper::toDto);
    }

    @Transactional
    public ReservationResponseDto fulfillReservation(ReservationActiveDto dto) {

        Reservation reservation = reservationRepository.findById(dto.getReservationID())
                .orElseThrow(() -> new RuntimeException("Rezervacija ne postoji"));

        if (!ReservationMapper.STATUS_PENDING.equalsIgnoreCase(reservation.getStatus())) {
            throw new RuntimeException("Rezervacija nije validna.");
        }

        if (reservation.getExpiresAt() != null && reservation.getExpiresAt().before(new Date())) {

            reservation.setStatus(ReservationMapper.STATUS_EXPIRED);

            BookInstance instance = reservation.getBookInstance();
            instance.setStatus(BookStatus.AVAILABLE);
            bookInstanceRepository.save(instance);

            reservationRepository.save(reservation);

            throw new RuntimeException("Rezervacija je istekla.");
        }

        reservation.setStatus(ReservationMapper.STATUS_FULFILLED);
        reservation.setUsed(true);

        BookInstance instance = reservation.getBookInstance();
        instance.setStatus(BookStatus.LOANED);
        bookInstanceRepository.save(instance);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dueDate = now.plusDays(loanDurationDays);

        Loan loan = Loan.builder()
                .user(reservation.getUser())
                .book(reservation.getBook())
                .bookInstance(instance)
                .reservation(reservation)
                .loanedAt(now)
                .dueDate(dueDate)
                .status(LoanStatus.ACTIVE)
                .build();

        loanRepository.save(loan);
        reservationRepository.save(reservation);

        return ReservationMapper.toDto(reservation);
    }

    @Transactional
    public ReservationResponseDto cancelReservation(Long userID, Long reservationID) {

        Reservation reservation = reservationRepository
                .findByReservationIDAndUser_UserID(reservationID, userID)
                .orElseThrow(() -> new RuntimeException("Rezervacija ne postoji"));

        if (!ReservationMapper.STATUS_PENDING.equalsIgnoreCase(reservation.getStatus())) {
            throw new RuntimeException("Možeš otkazati samo pending rezervaciju.");
        }

        reservation.setStatus(ReservationMapper.STATUS_CANCELED);
        BookInstance instance = reservation.getBookInstance();
        instance.setStatus(BookStatus.AVAILABLE);
        bookInstanceRepository.save(instance);

        reservationRepository.save(reservation);

        return ReservationMapper.toDto(reservation);
    }

    public Page<ReservationResponseDto> searchReservationsByMembership(
            String q, int page, int size, String sort) {

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

        return reservationRepository.searchByUserMembership(q.trim(), pageable)
                .map(ReservationMapper::toDto);
    }
}