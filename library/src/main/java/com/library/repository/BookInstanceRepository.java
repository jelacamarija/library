package com.library.repository;

import com.library.entity.Book;
import com.library.entity.BookInstance;
import com.library.entity.BookStatus;
import com.library.entity.Publication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookInstanceRepository extends JpaRepository<BookInstance, Long> {

    Optional<BookInstance> findFirstByPublication_BookAndStatus(
            Book book,
            BookStatus status
    );
    long countByPublicationAndStatus(Publication publication, BookStatus status);
}