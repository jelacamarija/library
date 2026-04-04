package com.library.service;

import com.library.dto.PublicationCreateDto;
import com.library.dto.PublicationResponseDto;
import com.library.entity.Book;
import com.library.entity.Publication;
import com.library.mapper.PublicationMapper;
import com.library.repository.BookRepository;
import com.library.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final BookRepository bookRepository;

    public PublicationResponseDto createPublication(PublicationCreateDto dto){

        Book book = bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new RuntimeException("Knjiga ne postoji"));

        publicationRepository.findByIsbn(dto.getIsbn())
                .ifPresent(p -> {
                    throw new RuntimeException("Publikacija sa ovim ISBN već postoji");
                });

        Publication publication= PublicationMapper.toEntity(dto,book);

        return PublicationMapper.toDto(publicationRepository.save(publication));
    }

   public PublicationResponseDto getById(Long id){

        Publication publication=publicationRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Publikacija nije pronađena"));

        return PublicationMapper.toDto(publication);
    }

    public Page<PublicationResponseDto> getAll(int page, int size){

        Pageable pageable= PageRequest.of(page,size, Sort.by("publishedYear").descending());

        return publicationRepository.findAll(pageable)
                .map(PublicationMapper::toDto);
    }

    public Page<PublicationResponseDto> searchByIsbn(String isbn, int page, int size){

        Pageable pageable= PageRequest.of(page,size, Sort.by("publishedYear").descending());

        return publicationRepository.findByIsbnContaining(isbn,pageable)
                .map(PublicationMapper::toDto);
    }

    //sve publikacije jedne knjige
    public Page<PublicationResponseDto> getByBook(Long bookID,int page,int size){

        bookRepository.findById(bookID)
                .orElseThrow(()->new RuntimeException("Knjiga nije pronađena"));

        Pageable pageable= PageRequest.of(page,size);

        return publicationRepository
                .findByBook_BookID(bookID,pageable)
                .map(PublicationMapper::toDto);
    }

    public Page<PublicationResponseDto> getAvailableByBook(Long bookID, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        return publicationRepository
                .findAvailableByBook(bookID, pageable)
                .map(PublicationMapper::toDto);
    }


}