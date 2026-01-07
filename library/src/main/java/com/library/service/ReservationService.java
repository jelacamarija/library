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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Calendar;
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

    public ReservationResponseDto createReservation(Long userID,Long bookID){

        User user=userRepository.findById(userID).orElseThrow(() -> new RuntimeException("Korisnik ne postoji"));

        Book book=bookRepository.findById(bookID).orElseThrow(()-> new RuntimeException("Knjiga ne postoji"));

        if(book.getCopiesAvailable()<=0){
            throw new RuntimeException("Knjiga trenutno nije dostupna za rezervaciju");
        }

        Optional<Reservation> existing=reservationRepository.findByUserAndBookAndStatusIn(user,book, List.of("PENDING"));

        if(existing.isPresent()){
            throw new RuntimeException("Vec imate aktivnu rezervaciju za ovu knjigu");

        }

        Reservation reservation = ReservationMapper.toEntity(user, book);

        reservationRepository.save(reservation);

        return ReservationMapper.toDto(reservation);
    }

    public List<ReservationResponseDto> getReservationsForUser(Long userID) {
        List<Reservation> reservations = reservationRepository.findByUserIdWithBook(userID);
        return reservations.stream()
                .map(r -> ReservationResponseDto.builder()
                        .reservationID(r.getReservationID())
                        .userID(r.getUser().getUserID())
                        .bookID(r.getBook().getBookID())
                        .bookTitle(r.getBook().getTitle())
                        .bookAuthor(r.getBook().getAuthor())
                        .reservedAt(r.getReservedAt())
                        .expiresAt(r.getExpiresAt())
                        .status(r.getStatus())
                        .loanID(r.getLoan()!=null ? r.getLoan().getLoanId():null)
                        .build()
                ).toList();
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
        Page<Reservation> reservations =
                reservationRepository.findByUser_UserID(userID, pageable);
        return reservations.map(ReservationMapper::toDto);
    }

    public ReservationResponseDto activateReservation(ReservationActiveDto dto){

        Reservation reservation=reservationRepository.findById(dto.getReservationID()).orElseThrow(()-> new RuntimeException("Rezervacija ne postoji"));

        if(!"PENDING".equalsIgnoreCase(reservation.getStatus())){
            throw  new RuntimeException("Rezervacija je vec istekla ili je aktivirana");

        }

        //aktiviranje reyervacije
        reservation.setStatus("ACTIVE");
        reservation.setUsed(true);
        reservation.setExpiresAt(null); //vise nema roka isteka
        reservationRepository.save(reservation);

        //kreiranje loan jer je rez preuzeta
        Book book=reservation.getBook();
        User user=reservation.getUser();

        if(book.getCopiesAvailable() <= 0){
            throw new RuntimeException("Nema dostupnih kopija knjige za pozajmicu");
        }
        Date now = new Date();
        Calendar calendar=Calendar.getInstance();
        calendar.setTime(now);
        calendar.add(Calendar.DAY_OF_MONTH,dto.getDays());
        Date dueDate=calendar.getTime();

        Loan loan=Loan.builder()
                .user(user)
                .book(book)
                .reservation(reservation)
                .loanedAt(now)
                .dueDate(dueDate)
                .status("ACTIVE")
                .build();

        loanRepository.save(loan);

        book.setCopiesAvailable(book.getCopiesAvailable()-1);
        bookRepository.save(book);

        return ReservationMapper.toDto(reservation);
    }
}
