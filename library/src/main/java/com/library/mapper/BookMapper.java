package com.library.mapper;

import com.library.dto.BookCreateRequestDto;
import com.library.dto.BookResponseDto;
import com.library.entity.Book;

public class BookMapper {

    public static Book toEntity(BookCreateRequestDto dto) {
        return Book.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .build();
    }

    public static BookResponseDto toDto(Book book) {
        return BookResponseDto.builder()
                .bookID(book.getBookID())
                .title(book.getTitle())
                .description(book.getDescription())
                .category(book.getCategory())
                .authors(
                        book.getAuthors().stream()
                                .map(a -> a.getName())
                                .toList()
                )
                .build();
    }
}
