package com.library.scheduler;

import com.library.entity.BookInstance;
import com.library.entity.BookStatus;
import com.library.entity.Reservation;
import com.library.entity.ReservationStatus;
import com.library.repository.BookInstanceRepository;
import com.library.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationsScheduler {

    private final ReservationRepository reservationRepository;
    private final BookInstanceRepository bookInstanceRepository;

    @Transactional
    @Scheduled(cron = "0 0 * * * *")
    public void expireReservations() {

        Date now = new Date();
        List<Reservation> expired = reservationRepository.findByStatusAndExpiresAtBefore
                (ReservationStatus.PENDING, now);
        if (expired.isEmpty()) {
            return;
        }
        for (Reservation reservation : expired) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            BookInstance instance = reservation.getBookInstance();
            if (instance != null && instance.getStatus() == BookStatus.RESERVED) {
                instance.setStatus(BookStatus.AVAILABLE);
                bookInstanceRepository.save(instance);
            }
            reservationRepository.save(reservation);
            log.info("Rezervacija #" + reservation.getReservationID() + " je istekla.");
        }
        log.info("Automatski proces isteka rezervacija završen. Ukupno: {}", expired.size());
    }

}