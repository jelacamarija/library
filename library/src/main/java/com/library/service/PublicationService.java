package com.library.service;

import com.library.entity.Book;
import com.library.entity.Publication;
import com.library.repository.BookRepository;
import com.library.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final BookRepository bookRepository;

    public Publication createPublication(Long bookId, Publication publication){

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Knjiga ne postoji"));

        publicationRepository.findByIsbn(publication.getIsbn())
                .ifPresent(p -> {
                    throw new RuntimeException("Publikacija sa ovim ISBN već postoji");
                });

        publication.setBook(book);

        return publicationRepository.save(publication);
    }

    public Publication getByIsbn(String isbn){
        return publicationRepository.findByIsbn(isbn)
                .orElseThrow(() -> new RuntimeException("Publikacija nije pronađen"));
    }
}