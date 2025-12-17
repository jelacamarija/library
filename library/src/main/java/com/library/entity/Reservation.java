package com.library.entity;


import jakarta.persistence.*;

import lombok.*;

import java.util.Date;

@Entity
@Table(name="reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationID;

    @ManyToOne
    @JoinColumn(name = "userID", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "bookID", nullable = false)
    private Book book;

    @Temporal(TemporalType.TIMESTAMP)
    private Date reservedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date expiresAt; // npr. +3 dana

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private boolean used;

    @OneToOne(mappedBy = "reservation")
    private Loan loan;
}
