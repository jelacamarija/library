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

import java.time.LocalDateTime;
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
    public LoanResponseDto createLoan(LoanCreateDto dto){

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));

        if (!(user instanceof Client client)) {
            throw new RuntimeException("Samo klijent može iznajmiti knjige.");
        }

        Membership membership = membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client)
                .orElseThrow(() -> new RuntimeException("Članarina ne postoji."));

        if (membership.getStatus() != MembershipStatus.ACTIVE) {
            throw new RuntimeException("Morate imati aktivnu članarinu.");
        }

        if(Boolean.FALSE.equals(user.getIsVerified())){
            throw new RuntimeException("Korisnik nije verifikovan.");
        }

        Book book = bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new RuntimeException("Knjiga nije pronađena"));

        if (loanRepository.existsByUserAndBookAndStatus(user, book, LoanStatus.ACTIVE)) {
            throw new RuntimeException("Već imate ovu knjigu.");
        }

        BookInstance instance = bookInstanceRepository
                .findFirstByPublication_BookAndStatus(book, BookStatus.AVAILABLE)
                .orElseThrow(() -> new RuntimeException("Nema dostupnih primeraka"));

        Reservation pending = reservationRepository
                .findTopByUserAndBookAndStatusOrderByReservedAtDesc(
                        user, book, ReservationMapper.STATUS_PENDING
                )
                .orElse(null);

        if (pending != null) {
            pending.setStatus(ReservationMapper.STATUS_FULFILLED);
            pending.setUsed(true);
            pending.setBookInstance(instance);
            reservationRepository.save(pending);
        }

        instance.setStatus(BookStatus.LOANED);
        bookInstanceRepository.save(instance);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dueDate = now.plusDays(loanDurationDays);

        Loan loan = Loan.builder()
                .user(user)
                .book(book)
                .bookInstance(instance)
                .reservation(pending)
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

        if (LoanStatus.RETURNED.equals(loan.getStatus())) {
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

        String role = (String) request.getAttribute("userRole");
        if (!"CLIENT".equalsIgnoreCase(role)) {
            throw new RuntimeException("Samo klijent može videti svoja iznajmljivanja.");
        }

        Long userId = (Long) request.getAttribute("userId");

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