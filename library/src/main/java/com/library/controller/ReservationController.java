package com.library.controller;

import com.library.dto.ReservationActiveDto;
import com.library.dto.ReservationCreateDto;
import com.library.dto.ReservationResponseDto;
import com.library.service.ReservationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/reserve")
    public ReservationResponseDto reserveBook(
            @RequestBody ReservationCreateDto dto,
            HttpServletRequest request
    ) {
        Long userID = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");

        if (userID == null) {
            throw new RuntimeException("Niste ulogovani");
        }

        if (!"CLIENT".equalsIgnoreCase(role)) {
            throw new RuntimeException("Samo klijent može kreirati rezervaciju");
        }

        return reservationService.createReservation(userID, dto.getBookID());
    }

    @GetMapping("/my")
    public List<ReservationResponseDto> getMyReservations(HttpServletRequest request) {
        Long userID = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");

        if (userID == null) {
            throw new RuntimeException("Niste ulogovani");
        }
        if (!"CLIENT".equalsIgnoreCase(role)) {
            throw new RuntimeException("Samo klijent može vidjeti svoje rezervacije");
        }

        return reservationService.getReservationsForUser(userID);
    }

    @GetMapping("/all")
    public Page<ReservationResponseDto> getAllReservations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "reservedAt,desc") String sort,
            HttpServletRequest request
    ) {
        String role = (String) request.getAttribute("userRole");

        if (role == null) {
            throw new RuntimeException("Niste ulogovani");
        }
        if (!role.equalsIgnoreCase("LIBRARIAN")) {
            throw new RuntimeException("Nemate ovlaštenje za pregled svih rezervacija");
        }

        return reservationService.getAllReservations(page, size, sort);
    }

    @GetMapping("/user/{userId}")
    public Page<ReservationResponseDto> getReservationsForUserLibrarian(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        String role = (String) request.getAttribute("userRole");

        if (role == null) {
            throw new RuntimeException("Niste ulogovani");
        }
        if (!role.equalsIgnoreCase("LIBRARIAN")) {
            throw new RuntimeException("Nemate ovlaštenje za pregled rezervacija korisnika");
        }

        return reservationService.getReservationsForUserLibrarian(userId, page, size);
    }

    @PostMapping("/fulfill")
    public ReservationResponseDto fulfillReservation(
            @RequestBody ReservationActiveDto dto,
            HttpServletRequest request
    ) {
        String role = (String) request.getAttribute("userRole");

        if (role == null) {
            throw new RuntimeException("Niste ulogovani");
        }
        if (!"LIBRARIAN".equalsIgnoreCase(role)) {
            throw new RuntimeException("Samo bibliotekar može aktivirati rezervaciju");
        }

        return reservationService.fulfillReservation(dto);
    }

    @PutMapping("/{id}/cancel")
    public ReservationResponseDto cancelMyReservation(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userID = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");

        if (userID == null) {
            throw new RuntimeException("Niste ulogovani");
        }
        if (!"CLIENT".equalsIgnoreCase(role)) {
            throw new RuntimeException("Samo klijent može otkazati rezervaciju");
        }

        return reservationService.cancelReservation(userID, id);
    }

    @GetMapping("/search-by-membership")
    public Page<ReservationResponseDto> searchByMembership(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "reservedAt,desc") String sort,
            HttpServletRequest request
    ) {
        requireLibrarian(request);
        return reservationService.searchReservationsByMembership(q, page, size, sort);
    }

    private void requireLibrarian(HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (role == null || !role.equalsIgnoreCase("LIBRARIAN")) {
            throw new RuntimeException("Zabranjen pristup");
        }
    }
}