package com.library.repository;

import com.library.entity.Book;
import com.library.entity.Loan;
import com.library.entity.LoanStatus;
import com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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
    @Query("""
        SELECT l FROM Loan l
        JOIN Client c ON l.user.userID = c.userID
        WHERE LOWER(c.membershipNumber) LIKE LOWER(CONCAT('%', :q, '%'))
        """)
    Page<Loan> searchByMembership(@Param("q") String q, Pageable pageable);
    @Query("""
        SELECT COUNT(l) > 0 FROM Loan l
        WHERE l.user = :user
        AND l.bookInstance.publication.book = :book
        AND l.status = :status
    """)
    boolean existsByUserAndBookAndStatus(
            @Param("user") User user,
            @Param("book") Book book,
            @Param("status") LoanStatus status
    );
    List<Loan> findByStatusAndDueDateBefore(LoanStatus status, LocalDateTime date);
}
