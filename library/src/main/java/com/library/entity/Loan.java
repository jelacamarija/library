package com.library.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name="loans")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long loanId;

    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "bookId", nullable = false)
    private Book book;

    @OneToOne
    @JoinColumn(name = "reservationId", nullable = true)
    private Reservation reservation;

    @Temporal(TemporalType.TIMESTAMP)
    private Date loanedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dueDate;

    @Temporal(TemporalType.TIMESTAMP)
    private Date returnedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status;

}
