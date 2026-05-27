package com.library.repository;

import com.library.entity.ReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReceiptItemRepository
        extends JpaRepository<ReceiptItem, Long> {
}
