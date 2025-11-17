package com.library.service;


import com.library.dto.ReservationResponseDto;
import com.library.entity.Book;
import com.library.entity.Reservation;
import com.library.entity.User;
import com.library.mapper.ReservationMapper;
import com.library.repository.BookRepository;
import com.library.repository.ReservationRespository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ResevationService {

    private final ReservationRespository reservationRespository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public ReservationResponseDto createReservation(Long userID,Long bookID){

        User user=userRepository.findById(userID).orElseThrow(() -> new RuntimeException("Korisnik ne postoji"));

        Book book=bookRepository.findById(bookID).orElseThrow(()-> new RuntimeException("Knjiga ne postoji"));

        if(book.getCopiesAvailable()<=0){
            throw new RuntimeException("Knjiga trenutno nije dostupna za rezervaciju");
        }

        Optional<Reservation> existing=reservationRespository.findByUserAndBookAndStatusIn(user,book, List.of("PENDING"));

        if(existing.isPresent()){
            throw new RuntimeException("Vec imate aktivnu rezervaciju za ovu knjigu");

        }

        Reservation reservation= ReservationMapper.toEntity(user,book);

        reservation.setReservedAt(new Date());
        reservation.setExpiresAt(new Date(System.currentTimeMillis() + 3L * 24 * 60 * 60 * 1000)); // 3 dana
        reservation.setStatus("PENDING");

        reservationRespository.save(reservation);

        return ReservationMapper.toDto(reservation);
    }
}
