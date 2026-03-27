package com.library.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicationResponseDto {

    private Long publicationID;

    private String isbn;
    private String publisher;
    private Integer publishedYear;
    private String edition;
    private String language;

    private Long bookID;
    private String bookTitle;
}
