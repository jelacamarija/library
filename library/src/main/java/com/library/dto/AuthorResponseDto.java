package com.library.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthorResponseDto {

    private Long authorID;
    private String name;
    private String biography;

}
