package com.library.service;


import com.library.dto.BookCreateRequestDto;
import com.library.dto.BookResponseDto;
import com.library.entity.Book;
import com.library.mapper.BookMapper;
import com.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    public BookResponseDto createBook(BookCreateRequestDto dto){
        bookRepository.findByIsbn(dto.getIsbn()).ifPresent(b -> {
            throw new RuntimeException("Knjiga sa ovim ISBN već postoji.");
        });
        Book book= BookMapper.toEntity(dto);
        Book savedBook=bookRepository.save(book);
        return BookMapper.toDto(savedBook);
    }

    public List<BookResponseDto> getAllBooks() {
        return bookRepository.findAll()
                .stream()
                .map(BookMapper::toDto)
                .toList();
    }

    public Page<BookResponseDto> getBooksPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Book> books = bookRepository.findAll(pageable);
        return books.map(BookMapper::toDto);
    }

    public BookResponseDto getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Knjiga sa ID " + id + " nije pronadjena"));
        return BookMapper.toDto(book);
    }

    public BookResponseDto updateBookCopies(Long id, Integer copiesToAdd) {
        if (copiesToAdd == null || copiesToAdd <= 0) {
            throw new RuntimeException("Broj kopija mora biti veći od 0.");
        }
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Knjiga sa ID " + id + " nije pronađena."));
        book.setCopiesTotal(book.getCopiesTotal() + copiesToAdd);
        book.setCopiesAvailable(book.getCopiesAvailable() + copiesToAdd);
        bookRepository.save(book);
        return BookMapper.toDto(book);
    }

    public BookResponseDto updateBookDescription(Long id, String description) {
        if (description == null || description.trim().isEmpty()) {
            throw new RuntimeException("Opis ne može biti prazan.");
        }
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Knjiga sa ID " + id + " nije pronađena."));
        book.setDescription(description);
        bookRepository.save(book);
        return BookMapper.toDto(book);
    }

    public Page<BookResponseDto> searchBooks(String query, int page, int size){

        Pageable pageable=PageRequest.of(page,size);

        Page<Book> books=bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
                query,
                query,
                pageable
        );

        return books.map(BookMapper::toDto);
    }

}
