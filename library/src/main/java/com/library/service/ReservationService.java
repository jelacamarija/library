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
    public ReservationResponseDto createReservation(Long userID, Long instanceId) {

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

        BookInstance instance = bookInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Primerak ne postoji"));

        if (instance.getStatus() != BookStatus.AVAILABLE) {
            throw new RuntimeException("Knjiga nije dostupna");
        }

        Optional<Reservation> existing =
                reservationRepository.findByUserAndBookInstanceAndStatus(
                        user, instance, ReservationStatus.PENDING
                );

        if (existing.isPresent()) {
            throw new RuntimeException("Već imate rezervaciju za ovaj primerak.");
        }

        instance.setStatus(BookStatus.RESERVED);

        Reservation reservation = Reservation.builder()
                .user(user)
                .bookInstance(instance)
                .reservedAt(new Date())
                .expiresAt(new Date(System.currentTimeMillis() + 3L * 24 * 60 * 60 * 1000))
                .status(ReservationStatus.PENDING)
                .used(false)
                .build();

        reservationRepository.save(reservation);

        return ReservationMapper.toDto(reservation);
    }

    public List<ReservationResponseDto> getReservationsForUser(Long userID) {

        return reservationRepository.findByUserIdWithInstance(userID)
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

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new RuntimeException("Rezervacija nije validna.");
        }

        if (reservation.getExpiresAt() != null &&
                reservation.getExpiresAt().before(new Date())) {

            reservation.setStatus(ReservationStatus.EXPIRED);

            BookInstance instance = reservation.getBookInstance();
            instance.setStatus(BookStatus.AVAILABLE);

            reservationRepository.save(reservation);

            throw new RuntimeException("Rezervacija je istekla.");
        }

        reservation.setStatus(ReservationStatus.FULFILLED);
        reservation.setUsed(true);

        BookInstance instance = reservation.getBookInstance();
        instance.setStatus(BookStatus.LOANED);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dueDate = now.plusDays(loanDurationDays);

        Loan loan = Loan.builder()
                .user(reservation.getUser())
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

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new RuntimeException("Možeš otkazati samo pending rezervaciju.");
        }

        reservation.setStatus(ReservationStatus.CANCELED);

        BookInstance instance = reservation.getBookInstance();
        instance.setStatus(BookStatus.AVAILABLE);

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