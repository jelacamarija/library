package com.library.scheduler;

import com.library.entity.Reservation;
import com.library.repository.ReservationRepository;
import com.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationsScheduler {
    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;

    @Scheduled(cron = "0 0 * * * *")
    public void expireReservations() {
        Date now = new Date();
        List<Reservation> expired = reservationRepository
                .findByStatusAndExpiresAtBefore("PENDING", now);
        if (expired.isEmpty()) { return;}
        for (Reservation reservation : expired) {
            reservation.setStatus("EXPIRED");
            reservation.getBook().setCopiesAvailable(
                    reservation.getBook().getCopiesAvailable() + 1
            );
            bookRepository.save(reservation.getBook());
            reservationRepository.save(reservation);
            log.info("Rezervacija #" + reservation.getReservationID() + " je istekla.");
        }
        log.info("Automatski proces isteka rezervacija je završen. " +
                "Ukupno isteklih: " + expired.size());
    }
}