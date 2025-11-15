package com.library.service;


import com.library.dto.BookCreateRequestDto;
import com.library.dto.BookResponseDto;
import com.library.entity.Book;
import com.library.mapper.BookMapper;
import com.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

}
