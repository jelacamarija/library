package com.library.mapper;

import com.library.dto.BookCreateRequestDto;
import com.library.dto.BookResponseDto;
import com.library.entity.Book;

public class BookMapper {

    public static Book toEntity(BookCreateRequestDto dto) {
        return Book.builder()
                .title(dto.getTitle())
                .author(dto.getAuthor())
                .isbn(dto.getIsbn())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .publishedYear(dto.getPublishedYear())
                .copiesTotal(dto.getCopiesTotal())
                .copiesAvailable(dto.getCopiesTotal()) // početno stanje
                .build();
    }

    public static BookResponseDto toDto(Book book) {
        return BookResponseDto.builder()
                .bookID(book.getBookID())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .description(book.getDescription())
                .category(book.getCategory())
                .publishedYear(book.getPublishedYear())
                .copiesTotal(book.getCopiesTotal())
                .copiesAvailable(book.getCopiesAvailable())
                .build();
    }
}
