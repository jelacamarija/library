package com.library.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "receipt_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long receiptId;

    @Column(nullable = false, unique = true)
    private String receiptNumber;

    private String supplier;

    private String note;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "librarian_id")
    private User librarian;

    @Builder.Default
    @OneToMany(mappedBy = "receiptNote",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<ReceiptItem> items = new ArrayList<>();
}