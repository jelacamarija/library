package com.library.service;

import com.library.dto.BookCreateRequestDto;
import com.library.dto.BookResponseDto;
import com.library.entity.Book;
import com.library.mapper.BookMapper;
import com.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    public BookResponseDto createBook(BookCreateRequestDto dto){
        Book book = BookMapper.toEntity(dto);

        Book savedBook = bookRepository.save(book);

        return BookMapper.toDto(savedBook);
    }

    public Page<BookResponseDto> getBooksPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return bookRepository.findAll(pageable)
                .map(BookMapper::toDto);
    }

    public BookResponseDto getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Knjiga nije pronađena"));
        return BookMapper.toDto(book);
    }

    public BookResponseDto updateBookDescription(Long id, String description) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Knjiga nije pronađena"));

        book.setDescription(description);

        return BookMapper.toDto(bookRepository.save(book));
    }

    public Page<BookResponseDto> searchBooks(String query, int page, int size){
        Pageable pageable = PageRequest.of(page, size);

        return bookRepository
                .findByTitleContainingIgnoreCaseOrAuthors_NameContainingIgnoreCase(
                        query,
                        query,
                        pageable
                )
                .map(BookMapper::toDto);
    }
}