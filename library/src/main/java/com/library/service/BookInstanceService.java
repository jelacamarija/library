package com.library.service;

import com.library.dto.*;
import com.library.entity.BookInstance;
import com.library.entity.BookStatus;
import com.library.entity.Publication;
import com.library.mapper.BookInstanceMapper;
import com.library.repository.BookInstanceRepository;
import com.library.repository.BookRepository;
import com.library.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookInstanceService {

    private final BookInstanceRepository bookInstanceRepository;
    private final PublicationRepository publicationRepository;
    private final BookRepository bookRepository;

    public BookInstanceResponseDto create(BookInstanceCreateDto dto) {

        Publication publication = publicationRepository.findById(dto.getPublicationId())
                .orElseThrow(() -> new RuntimeException("Publication ne postoji"));

        BookInstance instance = BookInstanceMapper.toEntity(dto, publication);

        String inventoryNumber=generateInventoryNumber(publication);
        instance.setInventoryNumber(inventoryNumber);
        return BookInstanceMapper.toDto(bookInstanceRepository.save(instance));
    }


    public BookInstanceResponseDto getById(Long id) {

        BookInstance instance = bookInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Primjerak nije pronađen"));

        return BookInstanceMapper.toDto(instance);
    }


    public Page<BookInstanceResponseDto> getAll(int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        return bookInstanceRepository.findAll(pageable)
                .map(BookInstanceMapper::toDto);
    }


    public Page<BookInstanceResponseDto> getByPublication(Long publicationId, int page, int size) {

        if (!publicationRepository.existsById(publicationId)) {
            throw new RuntimeException("Publication ne postoji");
        }
        Pageable pageable = PageRequest.of(page, size);

        return bookInstanceRepository
                .findByPublication_PublicationID(publicationId, pageable)
                .map(BookInstanceMapper::toDto);
    }


    public BookInstanceResponseDto updateLocation(Long id, BookInstanceUpdateLocationDto dto) {

        BookInstance instance = bookInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Primjerak nije pronađen"));

        if (dto.getLocation() == null || dto.getLocation().isBlank()) {
            throw new RuntimeException("Lokacija ne može biti prazna");
        }

        instance.setLocation(dto.getLocation());

        return BookInstanceMapper.toDto(bookInstanceRepository.save(instance));
    }

    //pretraga primjeraka po inventarnom broju
    public BookInstanceResponseDto getByInventoryNumber(String inventoryNumber) {

        BookInstance instance = bookInstanceRepository.findByInventoryNumber(inventoryNumber)
                .orElseThrow(() -> new RuntimeException("Primjerak nije pronađen"));

        return BookInstanceMapper.toDto(instance);
    }

    //broj dostupnih primjeraka za odredjenu knjigu
    public long countAvailableByBook(Long bookId) {

        if(!bookRepository.existsById(bookId)){
            throw new RuntimeException("Knjiga nije pronađena");
        }
        return bookInstanceRepository
                .countByPublication_Book_BookIDAndStatus(bookId, BookStatus.AVAILABLE);
    }


    //promjena statusa u damged ili lost
    public BookInstanceResponseDto markAsDamagedOrLost(Long id, String status) {

        BookInstance instance = bookInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Primjerak nije pronađen"));


        //ako je izdata ili rezervisana ne moze se promjeniti status u damaged ili lost
        if (instance.getStatus() == BookStatus.LOANED) {
            throw new RuntimeException("Knjiga je trenutno izdata i ne može biti označena kao oštećena ili izgubljena");
        }

        if (instance.getStatus() == BookStatus.RESERVED) {
            throw new RuntimeException("Knjiga je rezervisana i ne može biti označena kao oštećena ili izgubljena");
        }

        BookStatus newStatus;

        try {
            newStatus = BookStatus.valueOf(status.toUpperCase());
        } catch (Exception e) {
            throw new RuntimeException("Neispravan status");
        }


        if (newStatus != BookStatus.DAMAGED && newStatus != BookStatus.LOST) {
            throw new RuntimeException("Dozvoljeno je samo DAMAGED ili LOST");
        }

        instance.setStatus(newStatus);

        return BookInstanceMapper.toDto(bookInstanceRepository.save(instance));
    }

    public Page<BookInstanceUserDto> getAvailableInstancesForUser(Long bookId, int page, int size) {

        if (!bookRepository.existsById(bookId)) {
            throw new RuntimeException("Knjiga ne postoji");
        }

        Pageable pageable = PageRequest.of(page, size);

        return bookInstanceRepository
                .findByPublication_Book_BookIDAndStatus(bookId, BookStatus.AVAILABLE, pageable)
                .map(BookInstanceMapper::toUserDto);
    }

    private String generateInventoryNumber(Publication publication) {

        long count = bookInstanceRepository
                .countByPublication_PublicationID(publication.getPublicationID());

        return "INV-" + publication.getIsbn() + "-" + String.format("%03d", count + 1);
    }
}