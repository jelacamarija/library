package com.library.service;


import com.library.dto.LoanCreateDto;
import com.library.dto.LoanResponseDto;
import com.library.entity.Book;
import com.library.entity.Loan;
import com.library.entity.Reservation;
import com.library.entity.User;
import com.library.mapper.LoanMapper;
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


    public LoanResponseDto createLoan(LoanCreateDto dto){

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronadjen"));

        Book book = bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new RuntimeException("Knjiga nije pronadjena"));

        if (book.getCopiesAvailable() <= 0) {
            throw new RuntimeException("Knjiga trenutno nije dostupna za iznajmljivanje");

        }

        Reservation reservation=null;

        if(dto.getReservationID()!=null){
            reservation= reservationRepository.findById(dto.getReservationID())
                .orElseThrow(() -> new RuntimeException("Rezervacija nije pronadjena"));

            reservation.setStatus("ACTIVE");
            reservationRepository.save(reservation);

        }

        Loan loan = new Loan();
        loan.setUser(user);
        loan.setBook(book);
        loan.setReservation(reservation);
        loan.setLoanedAt(new Date());
        loan.setStatus("ACTIVE");

        Calendar cal=Calendar.getInstance();
        cal.setTime(new Date());
        cal.add(Calendar.DAY_OF_MONTH,dto.getDays());
        loan.setDueDate(cal.getTime());

        book.setCopiesAvailable(book.getCopiesAvailable() - 1);
        bookRepository.save(book);

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
        if ("RETURNED".equals(loan.getStatus())) {
            throw new RuntimeException("Knjiga je već označena kao vraćena.");
        }

        loan.setReturnedAt(new Date());
        loan.setStatus("RETURNED");

        Book book = loan.getBook();
        book.setCopiesAvailable(book.getCopiesAvailable() + 1);
        bookRepository.save(book);
        loanRepository.save(loan);
        return LoanMapper.toDto(loan);
    }

    public Page<LoanResponseDto> getActiveLoans(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Loan> loans = loanRepository.findByStatus("ACTIVE", pageable);
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
}
