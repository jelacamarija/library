package com.library.repository;

import aj.org.objectweb.asm.commons.Remapper;
import com.library.entity.Book;
import com.library.entity.BookInstance;
import com.library.entity.BookStatus;
import com.library.entity.Publication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookInstanceRepository extends JpaRepository<BookInstance, Long> {

    Page<BookInstance> findByPublication_PublicationID(Long publicationId, Pageable pageable);

    long countByPublication_PublicationIDAndStatus(Long publicationId, BookStatus status);

    long countByPublication_PublicationID(Long publicationID);

    Optional<BookInstance> findByInventoryNumber(String inventoryNumber);

    long countByPublication_Book_BookIDAndStatus(Long bookId, BookStatus status);

    Optional<BookInstance> findFirstByPublication_PublicationIDAndStatus(
            Long publicationId,
            BookStatus status
    );

    Page<BookInstance> findByPublication_Book_BookIDAndStatus(Long  id, BookStatus status,Pageable pageable);
}