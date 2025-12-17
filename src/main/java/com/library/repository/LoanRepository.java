package com.library.repository;

import com.library.entity.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    Optional<Loan> findById(Long id);
    Page<Loan> findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCase(
            String name,
            String email,
            Pageable pageable
    );
    Page<Loan> findByStatus(String status, Pageable pageable);
}
