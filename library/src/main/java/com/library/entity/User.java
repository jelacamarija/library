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

    @Column(nullable = false)
    private String password;


    @Column(length = 64)
    private String verifyCode;

    @Temporal(TemporalType.TIMESTAMP)
    private Date verifyCodeExpiry;

    private Boolean isVerified;

    @Column(nullable = false)
    private String role;



}
