package com.library.service;

import com.library.dto.*;
import com.library.entity.BookInstance;
import com.library.entity.Publication;
import com.library.mapper.BookInstanceMapper;
import com.library.repository.BookInstanceRepository;
import com.library.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookInstanceService {

    private final BookInstanceRepository bookInstanceRepository;
    private final PublicationRepository publicationRepository;

    // 🔹 CREATE
    public BookInstanceResponseDto create(BookInstanceCreateDto dto) {

        Publication publication = publicationRepository.findById(dto.getPublicationId())
                .orElseThrow(() -> new RuntimeException("Publication ne postoji"));

        BookInstance instance = BookInstanceMapper.toEntity(dto, publication);

        return BookInstanceMapper.toDto(bookInstanceRepository.save(instance));
    }

    // 🔹 GET BY ID
    public BookInstanceResponseDto getById(Long id) {

        BookInstance instance = bookInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Primjerak nije pronađen"));

        return BookInstanceMapper.toDto(instance);
    }

    // 🔹 GET ALL
    public Page<BookInstanceResponseDto> getAll(int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        return bookInstanceRepository.findAll(pageable)
                .map(BookInstanceMapper::toDto);
    }

    // 🔹 GET BY PUBLICATION
    public Page<BookInstanceResponseDto> getByPublication(Long publicationId, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        return bookInstanceRepository
                .findByPublication_PublicationID(publicationId, pageable)
                .map(BookInstanceMapper::toDto);
    }

    // 🔹 UPDATE LOCATION
    public BookInstanceResponseDto updateLocation(Long id, BookInstanceUpdateLocationDto dto) {

        BookInstance instance = bookInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Primjerak nije pronađen"));

        instance.setLocation(dto.getLocation());

        return BookInstanceMapper.toDto(bookInstanceRepository.save(instance));
    }
}