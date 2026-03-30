package com.library.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BookUserDto {

    private Long bookID;
    private String title;
    private List<String> authors;
}
