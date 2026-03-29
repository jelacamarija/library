package com.library.service;


import com.library.dto.*;
import com.library.entity.Author;
import com.library.mapper.AuthorMapper;
import com.library.repository.AuthorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import static org.apache.coyote.http11.Constants.a;


@Service
@RequiredArgsConstructor
public class AuthorService {

    private final AuthorRepository authorRepository;

    public AuthorResponseDto createAuthor(AuthorCreateDto dto){

        authorRepository.findByNameIgnoreCase(dto.getName())
                .ifPresent(a -> {
                    throw new RuntimeException("Autor već postoji");
                });

        Author author= AuthorMapper.toEntity(dto);

        return AuthorMapper.toDto(authorRepository.save(author));
    }

    public AuthorResponseDto updateBiography(Long id, AuthorUpdateDto dto) {

        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Autor nije pronađen"));

        author.setBiography(dto.getBiography());

        return AuthorMapper.toDto(authorRepository.save(author));
    }


    public AuthorResponseDto getById(Long id){

        Author author=authorRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Autor ne postoji"));

        return AuthorMapper.toDto(author);
    }

    public Page<AuthorResponseDto> getAll(int page, int size){

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());

        return authorRepository.findAll(pageable)
                .map(AuthorMapper::toDto);
    }

    public Page<AuthorResponseDto> search(String name, int page, int size){
        Pageable pageable=PageRequest.of(page,size,Sort.by("name").ascending());

        return authorRepository
                .findByNameContainingIgnoreCase(name,pageable)
                .map(AuthorMapper::toDto);
    }
}
