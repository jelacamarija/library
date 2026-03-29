package com.library.mapper;

import com.library.dto.AuthorCreateDto;
import com.library.dto.AuthorResponseDto;
import com.library.dto.AuthorUpdateDto;
import com.library.entity.Author;

public class AuthorMapper {

    public static Author toEntity(AuthorCreateDto dto){
        return Author.builder()
                .name(dto.getName())
                .biography(dto.getBiography())
                .build();
    }

    public static void updateEntity(Author author, AuthorUpdateDto dto){
        author.setBiography(dto.getBiography());
    }

    public static AuthorResponseDto toDto(Author author){
        return AuthorResponseDto.builder()
                .authorID(author.getAuthorID())
                .name(author.getName())
                .biography(author.getBiography())
                .build();
    }
}
