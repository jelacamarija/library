package com.library.service;

import com.library.dto.BookCreateDto;
import com.library.dto.BookResponseDto;
import com.library.dto.BookUpdateDescriptionDto;
import com.library.dto.BookUserDto;
import com.library.entity.Author;
import com.library.entity.Book;
import com.library.mapper.BookMapper;
import com.library.repository.AuthorRepository;
import com.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;

    public BookResponseDto createBook(BookCreateDto dto){

        List<Author> authors=authorRepository.findAllById(dto.getAuthorIds());

        bookRepository.findByTitleIgnoreCase(dto.getTitle())
                .ifPresent(b -> {
                    throw new RuntimeException("Knjiga sa tim naslovom već postoji");
                });

        if(authors.size()!=dto.getAuthorIds().size()){
            throw new RuntimeException("Neki autori nisu pronadjeni");
        }

        Book book=BookMapper.toEntity(dto,authors);

        return BookMapper.toDto(bookRepository.save(book));
    }

    public BookResponseDto updateDescription(Long id, BookUpdateDescriptionDto dto){
        Book book=bookRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Knjiga nije pronadjena"));

        book.setDescription(dto.getDescription());

        return BookMapper.toDto(bookRepository.save(book));
    }

    public BookResponseDto getById(Long id){

        Book book=bookRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Knjiga nije pronadjena"));

        return BookMapper.toDto(book);
    }

    public Page<BookResponseDto> getAll(int page, int size){

        Pageable pageable= PageRequest.of(page,size, Sort.by("title").ascending());

        return bookRepository.findAll(pageable)
                .map(BookMapper::toDto);
    }

    public Page<BookResponseDto> search(String query, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());

        return bookRepository
                .findByTitleContainingIgnoreCaseOrAuthors_NameContainingIgnoreCase(query, query, pageable)
                .map(BookMapper::toDto);
    }

    public Page<BookUserDto> getAvailableBooksForUser(int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        return bookRepository
                .findBooksWithAvailableInstances(pageable)
                .map(BookMapper::toUserDto);
    }

}