package com.library.service;

import com.library.dto.ReservationResponseDto;
import com.library.entity.*;
import com.library.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private BookInstanceRepository bookInstanceRepository;

    @Mock
    private PublicationRepository publicationRepository;

    @InjectMocks
    private ReservationService reservationService;

    private Client client;
    private Membership membership;
    private Book book;
    private Publication publication;
    private BookInstance instance;

    @BeforeEach
    void setUp() {

        client = new Client();
        client.setUserID(1L);
        client.setIsVerified(true);

        membership = new Membership();
        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setEndDate(LocalDate.now().plusMonths(1));

        book = new Book();
        book.setBookID(10L);
        book.setAuthors(new ArrayList<>());

        publication = new Publication();
        publication.setPublicationID(20L);
        publication.setBook(book);

        instance = new BookInstance();
        instance.setStatus(BookStatus.AVAILABLE);
        instance.setPublication(publication);
    }

    @Test
    void createReservation_success() {

        // Arrange
        when(clientRepository.findById(1L))
                .thenReturn(Optional.of(client));

        when(membershipRepository
                .findTopByClient_UserIDOrderByEndDateDesc(1L))
                .thenReturn(Optional.of(membership));

        when(publicationRepository.findById(20L))
                .thenReturn(Optional.of(publication));

        when(reservationRepository
                .existsByUser_UserIDAndBookInstance_Publication_Book_BookIDAndStatus(
                        1L, 10L, ReservationStatus.PENDING))
                .thenReturn(false);

        when(loanRepository
                .existsByUser_UserIDAndBookInstance_Publication_Book_BookIDAndStatus(
                        1L, 10L, LoanStatus.ACTIVE))
                .thenReturn(false);

        when(bookInstanceRepository
                .findFirstByPublication_PublicationIDAndStatus(
                        20L, BookStatus.AVAILABLE))
                .thenReturn(Optional.of(instance));

        // Act
        ReservationResponseDto result =
                reservationService.createReservation(20L, 1L);

        // Assert
        assertNotNull(result);
        assertEquals(BookStatus.RESERVED, instance.getStatus());

        verify(reservationRepository, times(1))
                .save(any(Reservation.class));

        verify(bookInstanceRepository, times(1))
                .save(instance);
    }

    @Test
    void createReservation_withoutActiveMembership_throwsException() {

        // Arrange
        membership.setStatus(MembershipStatus.EXPIRED);

        when(clientRepository.findById(1L))
                .thenReturn(Optional.of(client));

        when(membershipRepository
                .findTopByClient_UserIDOrderByEndDateDesc(1L))
                .thenReturn(Optional.of(membership));

        // Act
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> reservationService.createReservation(20L, 1L)
        );

        // Assert
        assertEquals(
                "Morate imati aktivnu članarinu",
                exception.getMessage()
        );

        verify(reservationRepository, never())
                .save(any(Reservation.class));

        verify(bookInstanceRepository, never())
                .save(any(BookInstance.class));
    }


    @Test
    void createReservation_alreadyReserved_throwsException() {

        // Arrange
        when(clientRepository.findById(1L))
                .thenReturn(Optional.of(client));

        when(membershipRepository
                .findTopByClient_UserIDOrderByEndDateDesc(1L))
                .thenReturn(Optional.of(membership));

        when(publicationRepository.findById(20L))
                .thenReturn(Optional.of(publication));

        when(reservationRepository
                .existsByUser_UserIDAndBookInstance_Publication_Book_BookIDAndStatus(
                        1L, 10L, ReservationStatus.PENDING))
                .thenReturn(true);

        // Act
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> reservationService.createReservation(20L, 1L)
        );

        // Assert
        assertEquals(
                "Već imate rezervaciju za ovu knjigu",
                exception.getMessage()
        );

        verify(reservationRepository, never())
                .save(any(Reservation.class));

        verify(bookInstanceRepository, never())
                .save(any(BookInstance.class));
    }

    @Test
    void createReservation_noAvailableInstances_throwsException() {

        // Arrange
        when(clientRepository.findById(1L))
                .thenReturn(Optional.of(client));

        when(membershipRepository
                .findTopByClient_UserIDOrderByEndDateDesc(1L))
                .thenReturn(Optional.of(membership));

        when(publicationRepository.findById(20L))
                .thenReturn(Optional.of(publication));

        when(reservationRepository
                .existsByUser_UserIDAndBookInstance_Publication_Book_BookIDAndStatus(
                        1L, 10L, ReservationStatus.PENDING))
                .thenReturn(false);

        when(loanRepository
                .existsByUser_UserIDAndBookInstance_Publication_Book_BookIDAndStatus(
                        1L, 10L, LoanStatus.ACTIVE))
                .thenReturn(false);

        when(bookInstanceRepository
                .findFirstByPublication_PublicationIDAndStatus(
                        20L, BookStatus.AVAILABLE))
                .thenReturn(Optional.empty());

        // Act
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> reservationService.createReservation(20L, 1L)
        );

        // Assert
        assertEquals(
                "Nema dostupnih primjeraka",
                exception.getMessage()
        );

        verify(reservationRepository, never())
                .save(any(Reservation.class));

        verify(bookInstanceRepository, never())
                .save(any(BookInstance.class));
    }

}