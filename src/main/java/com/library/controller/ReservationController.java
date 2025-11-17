package com.library.controller;


import com.library.dto.ReservationCreateDto;
import com.library.dto.ReservationResponseDto;
import com.library.service.ResevationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ResevationService resevationService;

    @PostMapping("/reserve")
    public ReservationResponseDto reserveBook(
            @RequestBody ReservationCreateDto dto,
            HttpServletRequest request
    ){
        Long userID= (Long) request.getAttribute("userId");
        String role= (String) request.getAttribute("userRole");

        if(userID==null){
            throw new RuntimeException("Niste ulogovani");
        }

        if(!"CLIENT".equalsIgnoreCase(role)){
            throw new RuntimeException("Samo klijent moze kreirati rezervaciju");
        }

        return resevationService.createReservation(userID,dto.getBookID());
    }
}
