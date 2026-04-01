package com.library.mapper;

import com.library.dto.BookCreateDto;
import com.library.dto.BookResponseDto;
import com.library.dto.BookUserDto;
import com.library.entity.Author;
import com.library.entity.Book;

import java.util.List;
import java.util.stream.Collectors;

public class BookMapper {

    public static Book toEntity(BookCreateDto dto, List<Author> authors) {
        return Book.builder()
                .title(dto.getTitle())
                .category(dto.getCategory())
                .description(dto.getDescription())
                .authors(authors)
                .build();
    }

    public static BookResponseDto toDto(Book book) {
        return BookResponseDto.builder()
                .bookID(book.getBookID())
                .title(book.getTitle())
                .category(book.getCategory())
                .description(book.getDescription())
                .authors(
                        book.getAuthors().stream()
                                .map(Author::getName)
                                .collect(Collectors.toList())
                )
                .build();
    }

    public static BookUserDto toUserDto(Book book) {
        return BookUserDto.builder()
                .bookID(book.getBookID())
                .title(book.getTitle())
                .description(book.getDescription())
                .category(book.getCategory())
                .authors(
                        book.getAuthors()
                                .stream()
                                .map(Author::getName)
                                .toList()
                )
                .build();
    }
}