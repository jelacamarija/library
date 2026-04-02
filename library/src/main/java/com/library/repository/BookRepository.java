package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    Page<Book> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<Book> findByAuthors_NameContainingIgnoreCase(String name, Pageable pageable);

    Optional<Book> findByTitleIgnoreCase(String title);

    @Query("""
    SELECT DISTINCT b
    FROM BookInstance bi
    JOIN bi.publication p
    JOIN p.book b
    WHERE bi.status = 'AVAILABLE'
""")
    Page<Book> findBooksWithAvailableInstances(Pageable pageable);

    Page<Book> findByTitleContainingIgnoreCaseOrAuthors_NameContainingIgnoreCase(
            String title,
            String author,
            Pageable pageable
    );

}