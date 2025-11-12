package com.library.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "user")
public class User{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userID;

    private String email;
    private String password;
    private String name;
    private String surname;
    private String role; // "USER" ili "LIBRARIAN"
    private boolean enabled = false;
    private LocalDateTime createdAt = LocalDateTime.now();

}
