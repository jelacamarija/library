package com.library.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;


@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
@Builder
@ToString
public class User{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userID;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(length = 20)
    private String phoneNumber;

    @Column(length = 64)
    private String verifyCode;

    @Temporal(TemporalType.TIMESTAMP)
    private Date verifyCodeExpiry;

    private Boolean isVerified;

    private Boolean active;

    @Column(nullable = false)
    private String role;

    @Column(unique = true)
    private String membershipNumber;


    @Temporal(TemporalType.DATE)
    private Date membershipDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = new Date();
        if (active == null) active = true;
        if (isVerified == null) isVerified = false;
    }

}
