package com.library.service;

import com.library.dto.LoanCreateDto;
import com.library.dto.LoanResponseDto;
import com.library.entity.*;
import com.library.mapper.LoanMapper;
import com.library.mapper.ReservationMapper;
import com.library.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final ReservationRepository reservationRepository;
    private final MembershipRepository membershipRepository;
    private final BookInstanceRepository bookInstanceRepository;

    @Value("${library.loan.duration-days}")
    private int loanDurationDays;

    @Transactional
    public LoanResponseDto createLoan(LoanCreateDto dto) {

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen."));

        if (!(user instanceof Client client)) {
            throw new RuntimeException("Samo klijent može iznajmiti knjige.");
        }

        if (Boolean.FALSE.equals(user.getIsVerified())) {
            throw new RuntimeException("Korisnik nije verifikovan.");
        }

        Membership membership = membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client)
                .orElseThrow(() -> new RuntimeException("Članarina ne postoji."));

        if (membership.getStatus() != MembershipStatus.ACTIVE ||
                membership.getEndDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Korisnik nema aktivnu članarinu.");
        }

        BookInstance instance = bookInstanceRepository.findById(dto.getInstanceId())
                .orElseThrow(() -> new RuntimeException("Primerak ne postoji."));

        if (instance.getStatus() != BookStatus.AVAILABLE) {
            throw new RuntimeException("Primerak nije dostupan.");
        }

        Book book = instance.getPublication().getBook();


        boolean alreadyLoaned =
                loanRepository.existsByUserAndBookAndStatus(user, book, LoanStatus.ACTIVE);

        if (alreadyLoaned) {
            throw new RuntimeException("Korisnik već ima ovu knjigu.");
        }

        LocalDateTime now = LocalDateTime.now();


        Reservation reservation = reservationRepository
                .findTopByUserAndBookInstanceAndStatusOrderByReservedAtDesc(
                        user, instance, ReservationStatus.PENDING
                ).orElse(null);


        if (reservation != null && reservation.getExpiresAt().toInstant()
                .isBefore(now.atZone(ZoneId.systemDefault()).toInstant())) {

            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);
            reservation = null;
        }


        if (reservation == null) {
            boolean hasOtherReservation =
                    reservationRepository.existsByUserAndBookInstance_Publication_BookAndStatusAndBookInstanceNot(
                            user, book, ReservationStatus.PENDING, instance
                    );

            if (hasOtherReservation) {
                throw new RuntimeException("Korisnik ima rezervaciju za ovu knjigu. Obratite se bibliotekaru.");
            }
        }


        if (reservation != null) {
            reservation.setStatus(ReservationStatus.FULFILLED);
            reservation.setUsed(true);
            reservationRepository.save(reservation);
        }


        instance.setStatus(BookStatus.LOANED);

        LocalDateTime dueDate = now.plusDays(loanDurationDays);

        Loan loan = Loan.builder()
                .user(user)
                .bookInstance(instance)
                .reservation(reservation)
                .loanedAt(now)
                .dueDate(dueDate)
                .status(LoanStatus.ACTIVE)
                .build();

        loanRepository.save(loan);

        return LoanMapper.toDto(loan);
    }

    public LoanResponseDto returnBook(Long loanID) {

        Loan loan = loanRepository.findById(loanID)
                .orElseThrow(() -> new RuntimeException("Iznajmljivanje ne postoji."));

        if (loan.getStatus() == LoanStatus.RETURNED) {
            throw new RuntimeException("Knjiga je već vraćena.");
        }

        loan.setReturnedAt(LocalDateTime.now());
        loan.setStatus(LoanStatus.RETURNED);
        BookInstance instance = loan.getBookInstance();
        instance.setStatus(BookStatus.AVAILABLE);
        bookInstanceRepository.save(instance);
        loanRepository.save(loan);
        return LoanMapper.toDto(loan);
    }

    public Page<LoanResponseDto> getAllLoans(int page, int size, String sort) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction =
                (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        return loanRepository.findAll(pageable).map(LoanMapper::toDto);
    }

    public Page<LoanResponseDto> searchLoansByUserName(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return loanRepository
                .findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCase(
                        query, query, pageable
                )
                .map(LoanMapper::toDto);
    }

    public Page<LoanResponseDto> getActiveLoans(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return loanRepository.findByStatus(LoanStatus.ACTIVE, pageable)
                .map(LoanMapper::toDto);
    }

    public List<LoanResponseDto> getMyLoans(HttpServletRequest request) {

        Long userId = (Long) request.getAttribute("userId");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Korisnik ne postoji"));

        if (!(user instanceof Client)) {
            throw new RuntimeException("Samo klijent može videti svoja iznajmljivanja.");
        }

        return loanRepository.findByUser_UserIDOrderByLoanedAtDesc(userId)
                .stream()
                .map(LoanMapper::toDto)
                .toList();
    }

    public Page<LoanResponseDto> searchLoansByMembershipNumber(int page, int size, String sort, String q) {

        if (q == null || q.trim().isEmpty()) return Page.empty();

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction =
                (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        return loanRepository.searchByMembership(q.trim(), pageable)
                .map(LoanMapper::toDto);
    }
}