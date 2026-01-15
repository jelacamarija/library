package com.library.repository;

import com.library.entity.Book;
import com.library.entity.Loan;
import com.library.entity.LoanStatus;
import com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    Optional<Loan> findById(Long id);
    Page<Loan> findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCase(
            String name,
            String email,
            Pageable pageable
    );
    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);
    List<Loan> findByUser_UserIDOrderByLoanedAtDesc(Long userId);
    Page<Loan> findByUser_MembershipNumberContainingIgnoreCase(String membershipNumber, Pageable pageable);
    boolean existsByUserAndBookAndStatus(User user, Book book, LoanStatus status);

    List<Loan> findByStatusAndDueDateBefore(LoanStatus status, Date date);
}
