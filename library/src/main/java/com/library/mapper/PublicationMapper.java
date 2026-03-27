package com.library.mapper;

import com.library.dto.PublicationCreateRequestDto;
import com.library.dto.PublicationResponseDto;
import com.library.entity.Book;
import com.library.entity.Publication;

public class PublicationMapper {

    public static Publication toEntity(PublicationCreateRequestDto dto) {
        return Publication.builder()
                .isbn(dto.getIsbn())
                .publisher(dto.getPublisher())
                .publishedYear(dto.getPublishedYear())
                .edition(dto.getEdition())
                .language(dto.getLanguage())
                .book(Book.builder()
                        .bookID(dto.getBookId())
                        .build())
                .build();
    }

    public static PublicationResponseDto toDto(Publication p) {
        return PublicationResponseDto.builder()
                .publicationID(p.getPublicationID())
                .isbn(p.getIsbn())
                .publisher(p.getPublisher())
                .publishedYear(p.getPublishedYear())
                .edition(p.getEdition())
                .language(p.getLanguage())
                .bookID(p.getBook().getBookID())
                .bookTitle(p.getBook().getTitle())
                .build();
    }
}
