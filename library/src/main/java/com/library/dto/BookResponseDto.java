package com.library.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BookResponseDto {

    private Long bookID;
    private String title;
    private String description;
    private String category;
    private List<String> authors;
}
