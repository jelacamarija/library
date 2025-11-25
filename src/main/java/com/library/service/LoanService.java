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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Calendar;
import java.util.Date;

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
}
