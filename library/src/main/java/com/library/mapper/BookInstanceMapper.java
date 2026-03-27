package com.library.mapper;

import com.library.dto.BookInstanceCreateRequestDto;
import com.library.dto.BookInstanceResponseDto;
import com.library.entity.BookInstance;
import com.library.entity.BookStatus;
import com.library.entity.Publication;

public class BookInstanceMapper {

    public static BookInstance toEntity(BookInstanceCreateRequestDto dto) {
        return BookInstance.builder()
                .inventoryNumber(dto.getInventoryNumber())
                .location(dto.getLocation())
                .status(BookStatus.AVAILABLE)
                .publication(Publication.builder()
                        .publicationID(dto.getPublicationId())
                        .build())
                .build();
    }

    public static BookInstanceResponseDto toDto(BookInstance i) {

        var publication = i.getPublication();
        var book = publication.getBook();

        return BookInstanceResponseDto.builder()
                .instanceID(i.getInstanceID())
                .inventoryNumber(i.getInventoryNumber())
                .location(i.getLocation())
                .status(i.getStatus().name())

                .publicationID(publication.getPublicationID())
                .isbn(publication.getIsbn())

                .bookTitle(book.getTitle())

                .authors(
                book.getAuthors().stream()
                        .map(a -> a.getName())
                        .toList()
                )
                .build();
    }
}
