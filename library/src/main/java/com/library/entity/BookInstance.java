package com.library.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_instances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long instanceID;

    @Column(nullable = false, unique = true)
    private String inventoryNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookStatus status;

    @Column(nullable = false)
    private String location;

    @ManyToOne
    @JoinColumn(name = "publication_id", nullable = false)
    private Publication publication;
}