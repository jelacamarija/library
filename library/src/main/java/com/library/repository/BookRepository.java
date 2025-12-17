package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookRepository extends JpaRepository<Book,Long> {

    Optional<Book> findByIsbn(String isbn);

    Page<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
            String title,
            String author,
            Pageable pageable
    );

    Page<Book> findByCategoryIgnoreCase(String category,Pageable pageable);



}
