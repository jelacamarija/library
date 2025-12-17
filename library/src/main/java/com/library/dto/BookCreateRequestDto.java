package com.library.dto;


import lombok.Data;

@Data
public class BookCreateRequestDto {

    private String title;
    private String author;
    private String isbn;
    private String description;
    private String category;
    private Integer publishedYear;
    private Integer copiesTotal;

}
