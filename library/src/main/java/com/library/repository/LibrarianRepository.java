package com.library.repository;

import com.library.entity.Librarian;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LibrarianRepository extends JpaRepository<Librarian,Long> {
    Optional<Librarian> findByEmail(String email);
    Page<Librarian> findAll(Pageable pageable);
    Page<Librarian> findByEmployeeCodeContainingIgnoreCase(String code, Pageable pageable);
}
