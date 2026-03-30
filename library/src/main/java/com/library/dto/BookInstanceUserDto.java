package com.library.dto;
import lombok.Builder;

import lombok.Data;

import java.util.List;

@Data
@Builder
public class BookInstanceUserDto {

    private Long instanceID;

    private String isbn;
    private String bookTitle;
    private List<String> authors;

    private Integer publishedYear;
    private String publisher;
    private String language;
}