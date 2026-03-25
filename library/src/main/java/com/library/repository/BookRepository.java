package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {

    Page<Book> findByTitleContainingIgnoreCaseOrAuthors_NameContainingIgnoreCase(
            String title,
            String author,
            Pageable pageable
    );

    Page<Book> findByCategoryIgnoreCase(String category, Pageable pageable);
}