
package com.library.service;

import com.library.dto.LoanCreateDto;
import com.library.dto.LoanResponseDto;
import com.library.entity.*;
import com.library.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private BookInstanceRepository bookInstanceRepository;

    @InjectMocks
    private LoanService loanService;

    private Client client;
    private Membership membership;
    private Book book;
    private Publication publication;
    private BookInstance instance;
    private LoanCreateDto dto;

    @BeforeEach
    void setUp() {

        ReflectionTestUtils.setField(
                loanService,
                "loanDurationDays",
                14
        );

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

        dto = new LoanCreateDto();
        dto.setUserId(1L);
        dto.setInstanceId(30L);
    }

    // OSNOVNI SCENARIO
    @Test
    void createLoan_success() {

        // ARRANGE
        when(userRepository.findById(1L))
                .thenReturn(Optional.of(client));

        when(membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client))
                .thenReturn(Optional.of(membership));

        when(bookInstanceRepository.findById(30L))
                .thenReturn(Optional.of(instance));

        when(loanRepository.existsByUserAndBookAndStatus(
                client,
                book,
                LoanStatus.ACTIVE))
                .thenReturn(false);

        when(reservationRepository
                .findTopByUserAndBookInstanceAndStatusOrderByReservedAtDesc(
                        client,
                        instance,
                        ReservationStatus.PENDING))
                .thenReturn(Optional.empty());

        when(reservationRepository
                .existsByUserAndBookInstance_Publication_BookAndStatusAndBookInstanceNot(
                        client,
                        book,
                        ReservationStatus.PENDING,
                        instance))
                .thenReturn(false);

        // ACT
        LoanResponseDto result = loanService.createLoan(dto);

        // ASSERT
        assertNotNull(result);

        assertEquals(
                BookStatus.LOANED,
                instance.getStatus()
        );

        verify(loanRepository, times(1))
                .save(any(Loan.class));
    }

    // ALTERNATIVNI SCENARIO 1
    @Test
    void createLoan_withoutActiveMembership_throwsException() {

        // ARRANGE
        membership.setStatus(MembershipStatus.EXPIRED);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(client));

        when(membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client))
                .thenReturn(Optional.of(membership));

        // ACT
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> loanService.createLoan(dto)
        );

        // ASSERT
        assertEquals(
                "Korisnik nema aktivnu članarinu.",
                exception.getMessage()
        );

        verify(loanRepository, never())
                .save(any(Loan.class));
    }

    // ALTERNATIVNI SCENARIO 2
    @Test
    void createLoan_instanceNotAvailable_throwsException() {

        // ARRANGE
        instance.setStatus(BookStatus.LOANED);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(client));

        when(membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client))
                .thenReturn(Optional.of(membership));

        when(bookInstanceRepository.findById(30L))
                .thenReturn(Optional.of(instance));

        // ACT
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> loanService.createLoan(dto)
        );

        // ASSERT
        assertEquals(
                "Primerak nije dostupan.",
                exception.getMessage()
        );

        verify(loanRepository, never())
                .save(any(Loan.class));
    }

    // ALTERNATIVNI SCENARIO 3
    @Test
    void createLoan_userAlreadyHasBook_throwsException() {

        // ARRANGE
        when(userRepository.findById(1L))
                .thenReturn(Optional.of(client));

        when(membershipRepository
                .findFirstByClientOrderByCreatedAtDesc(client))
                .thenReturn(Optional.of(membership));

        when(bookInstanceRepository.findById(30L))
                .thenReturn(Optional.of(instance));

        when(loanRepository.existsByUserAndBookAndStatus(
                client,
                book,
                LoanStatus.ACTIVE))
                .thenReturn(true);

        // ACT
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> loanService.createLoan(dto)
        );

        // ASSERT
        assertEquals(
                "Korisnik već ima ovu knjigu.",
                exception.getMessage()
        );

        verify(loanRepository, never())
                .save(any(Loan.class));
    }
}