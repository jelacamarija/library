package com.library.repository;

import com.library.entity.Publication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PublicationRepository extends JpaRepository<Publication, Long> {

    Optional<Publication> findByIsbn(String isbn);

    Page<Publication> findByBook_BookID(Long bookId, Pageable pageable);

    Page<Publication> findByIsbnContaining(String isbn, Pageable pageable);
}