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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ClientRepository clientRepository;
    private final LoanRepository loanRepository;
    private final MembershipRepository membershipRepository;
    private final BookInstanceRepository bookInstanceRepository;
    private final PublicationRepository publicationRepository;

    @Value("${library.loan.duration-days}")
    private int loanDurationDays;

    @Transactional
    public ReservationResponseDto createReservation(Long publicationId, Long userId) {


        Client client = clientRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Korisnik ne postoji"));

        if (Boolean.FALSE.equals(client.getIsVerified())) {
            throw new RuntimeException("Korisnik nije verifikovan");
        }


        Membership membership = membershipRepository
                .findTopByClient_UserIDOrderByEndDateDesc(client.getUserID())
                .orElseThrow(() -> new RuntimeException("Nemate aktivnu članarinu"));

        if (membership.getStatus() != MembershipStatus.ACTIVE ||
                membership.getEndDate().isBefore(LocalDate.now())) {

            throw new RuntimeException("Morate imati aktivnu članarinu");
        }


        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new RuntimeException("Publikacija ne postoji"));

        Long bookId = publication.getBook().getBookID();


        boolean alreadyReserved =
                reservationRepository.existsByUser_UserIDAndBookInstance_Publication_Book_BookIDAndStatus(
                        userId,
                        bookId,
                        ReservationStatus.PENDING
                );

        if (alreadyReserved) {
            throw new RuntimeException("Već imate rezervaciju za ovu knjigu");
        }


        boolean alreadyLoaned =
                loanRepository.existsByUser_UserIDAndBookInstance_Publication_Book_BookIDAndStatus(
                        userId,
                        bookId,
                        LoanStatus.ACTIVE
                );

        if (alreadyLoaned) {
            throw new RuntimeException("Već imate ovu knjigu iznajmljenu");
        }


        BookInstance instance = bookInstanceRepository
                .findFirstByPublication_PublicationIDAndStatus(publicationId, BookStatus.AVAILABLE)
                .orElseThrow(() -> new RuntimeException("Nema dostupnih primjeraka"));


        if (instance.getStatus() != BookStatus.AVAILABLE) {
            throw new RuntimeException("Primjerak više nije dostupan");
        }


        Reservation reservation = Reservation.builder()
                .user(client)
                .bookInstance(instance)
                .reservedAt(new Date())
                .expiresAt(new Date(System.currentTimeMillis() + 3L*2460*60*1000))
                .status(ReservationStatus.PENDING)
                .used(false)
                .build();


        instance.setStatus(BookStatus.RESERVED);


        reservationRepository.save(reservation);
        bookInstanceRepository.save(instance);

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