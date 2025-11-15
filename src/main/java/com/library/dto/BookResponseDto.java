package com.library.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookResponseDto {

    private Long bookID;
    private String title;
    private String author;
    private String isbn;
    private String description;
    private String category;
    private Integer publishedYear;
    private Integer copiesTotal;
    private Integer copiesAvailable;
}
