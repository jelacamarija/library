package com.library.service;


import com.library.dto.ReservationResponseDto;
import com.library.entity.Book;
import com.library.entity.Reservation;
import com.library.entity.User;
import com.library.mapper.ReservationMapper;
import com.library.repository.BookRepository;
import com.library.repository.ReservationRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

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
        List<Reservation> reservations = reservationRepository.findByUser_UserID(userID);
        return reservations.stream()
                .map(r -> ReservationResponseDto.builder()
                        .reservationID(r.getReservationID())
                        .userID(r.getUser().getUserID())
                        .bookID(r.getBook().getBookID())
                        .bookTitle(r.getBook().getTitle())
                        .reservedAt(r.getReservedAt())
                        .expiresAt(r.getExpiresAt())
                        .status(r.getStatus())
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
}
