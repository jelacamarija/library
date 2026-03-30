package com.library.mapper;

import com.library.dto.BookInstanceCreateDto;
import com.library.dto.BookInstanceResponseDto;
import com.library.dto.BookInstanceUserDto;
import com.library.entity.Author;
import com.library.entity.BookInstance;
import com.library.entity.BookStatus;
import com.library.entity.Publication;

public class BookInstanceMapper {

    public static BookInstance toEntity(BookInstanceCreateDto dto, Publication publication) {
        return BookInstance.builder()
                .location(dto.getLocation())
                .status(BookStatus.AVAILABLE)
                .publication(publication)
                .build();
    }

    public static BookInstanceResponseDto toDto(BookInstance instance) {
        return BookInstanceResponseDto.builder()
                .instanceID(instance.getInstanceID())
                .inventoryNumber(instance.getInventoryNumber())
                .location(instance.getLocation())
                .status(instance.getStatus()) // enum

                .publicationID(instance.getPublication().getPublicationID())
                .isbn(instance.getPublication().getIsbn())

                .bookTitle(instance.getPublication().getBook().getTitle())

                .authors(
                        instance.getPublication().getBook().getAuthors()
                                .stream()
                                .map(Author::getName)
                                .toList()
                )
                .build();
    }

    public static BookInstanceUserDto toUserDto(BookInstance instance) {
        return BookInstanceUserDto.builder()
                .instanceID(instance.getInstanceID())
                .isbn(instance.getPublication().getIsbn())
                .bookTitle(instance.getPublication().getBook().getTitle())
                .authors(
                        instance.getPublication().getBook().getAuthors()
                                .stream()
                                .map(Author::getName)
                                .toList()
                )
                .publishedYear(instance.getPublication().getPublishedYear())
                .publisher(instance.getPublication().getPublisher())
                .language(instance.getPublication().getLanguage())
                .build();
    }
}