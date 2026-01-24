package com.library.service;


import com.library.dto.LoanCreateDto;
import com.library.dto.LoanResponseDto;
import com.library.entity.*;
import com.library.mapper.LoanMapper;
import com.library.mapper.ReservationMapper;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.ReservationRepository;
import com.library.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import java.time.LocalDateTime;


import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final ReservationRepository reservationRepository;

    @Value("${library.loan.duration-days}")
    private int loanDurationDays;



    @Transactional
    public LoanResponseDto createLoan(LoanCreateDto dto){

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));

        Book book = bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new RuntimeException("Knjiga nije pronađena"));

        if(Boolean.FALSE.equals(user.getIsVerified())){
            throw new RuntimeException("Korisnik nije verifikovan. Ne može iznajmiti knjigu.");
        }

        if (loanRepository.existsByUserAndBookAndStatus(user, book, LoanStatus.ACTIVE)) {
            throw new RuntimeException("Korisnik već ima aktivno iznajmljivanje za ovu knjigu.");
        }

        LocalDateTime now = LocalDateTime.now();


        Reservation pending = reservationRepository
                .findTopByUserAndBookAndStatusOrderByReservedAtDesc(
                        user, book, ReservationMapper.STATUS_PENDING
                )
                .orElse(null);

        if (pending != null) {

            if (pending.getExpiresAt() != null && pending.getExpiresAt().before(new java.util.Date())) {

                pending.setStatus(ReservationMapper.STATUS_EXPIRED);
                reservationRepository.save(pending);
                book.setCopiesAvailable(book.getCopiesAvailable() + 1);
                bookRepository.save(book);
                pending = null;
            }
        }

        if (pending == null) {
            if (book.getCopiesAvailable() <= 0) {
                throw new RuntimeException("Knjiga trenutno nije dostupna za iznajmljivanje.");
            }
            book.setCopiesAvailable(book.getCopiesAvailable() - 1);
            bookRepository.save(book);
        } else {
            pending.setStatus(ReservationMapper.STATUS_FULFILLED);
            pending.setUsed(true);
            reservationRepository.save(pending);
        }

        LocalDateTime dueDate = now.plusDays(loanDurationDays);


        Loan loan = Loan.builder()
                .user(user)
                .book(book)
                .reservation(pending)
                .loanedAt(now)
                .dueDate(dueDate)
                .status(LoanStatus.ACTIVE)
                .build();

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
        Page<Loan> loansPage = loanRepository.findAll(pageable);
        return loansPage.map(LoanMapper::toDto);
    }

    public Page<LoanResponseDto> searchLoansByUserName(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Loan> loans =
                loanRepository.findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCase(
                        query, query, pageable
                );
        return loans.map(LoanMapper::toDto);
    }

    public LoanResponseDto returnBook(Long loanID) {

        Loan loan = loanRepository.findById(loanID)
                .orElseThrow(() -> new RuntimeException("Iznajmljivanje ne postoji."));
        if (LoanStatus.RETURNED.equals(loan.getStatus())) {
            throw new RuntimeException("Knjiga je već označena kao vraćena.");
        }

        loan.setReturnedAt(LocalDateTime.now());
        loan.setStatus(LoanStatus.RETURNED);

        Book book = loan.getBook();
        book.setCopiesAvailable(book.getCopiesAvailable() + 1);
        bookRepository.save(book);
        loanRepository.save(loan);
        return LoanMapper.toDto(loan);
    }

    public Page<LoanResponseDto> getActiveLoans(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Loan> loans = loanRepository.findByStatus(LoanStatus.ACTIVE, pageable);
        return loans.map(LoanMapper::toDto);
    }

    public List<LoanResponseDto> getMyLoans(HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (!"CLIENT".equalsIgnoreCase(role)) {
            throw new RuntimeException("Pristup zabranjen: samo klijent može vidjeti svoja iznajmljivanja.");
        }

        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Nedostaje userId u request-u.");
        }

        return loanRepository.findByUser_UserIDOrderByLoanedAtDesc(userId)
                .stream()
                .map(LoanMapper::toDto)
                .toList();
    }

    public Page<LoanResponseDto> searchLoansByMembershipNumber(int page, int size, String sort, String q) {
        String query = (q == null) ? "" : q.trim();
        if (query.isEmpty()) return Page.empty();

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction =
                (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        Page<Loan> loansPage = loanRepository.findByUser_MembershipNumberContainingIgnoreCase(query, pageable);

        return loansPage.map(LoanMapper::toDto);
    }



}
