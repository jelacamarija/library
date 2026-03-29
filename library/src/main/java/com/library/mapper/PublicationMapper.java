package com.library.mapper;

import com.library.dto.PublicationCreateDto;
import com.library.dto.PublicationResponseDto;
import com.library.entity.Book;
import com.library.entity.Publication;

public class PublicationMapper {

    public static Publication toEntity(PublicationCreateDto dto, Book book) {
        return Publication.builder()
                .isbn(dto.getIsbn())
                .publisher(dto.getPublisher())
                .publishedYear(dto.getPublishedYear())
                .edition(dto.getEdition())
                .language(dto.getLanguage())
                .book(book)
                .build();
    }

    public static PublicationResponseDto toDto(Publication publication) {
        return PublicationResponseDto.builder()
                .publicationID(publication.getPublicationID())
                .isbn(publication.getIsbn())
                .publisher(publication.getPublisher())
                .publishedYear(publication.getPublishedYear())
                .edition(publication.getEdition())
                .language(publication.getLanguage())
                .bookID(publication.getBook().getBookID())
                .bookTitle(publication.getBook().getTitle())
                .build();
    }
}