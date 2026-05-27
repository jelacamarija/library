package com.library.repository;

import com.library.entity.ReceiptNote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReceiptNoteRepository
        extends JpaRepository<ReceiptNote, Long> {
}