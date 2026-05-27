package com.library.service;

import com.library.dto.ReceiptCreateDto;
import com.library.dto.ReceiptResponseDto;
import com.library.dto.ReceiptItemCreateDto;
import com.library.dto.ReceiptItemResponseDto;
import com.library.entity.*;
import com.library.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReceiptService {

    private final ReceiptNoteRepository receiptNoteRepository;
    private final PublicationRepository publicationRepository;
    private final BookInstanceRepository bookInstanceRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReceiptResponseDto createReceipt(
            ReceiptCreateDto dto,
            Long librarianId
    ) {

        User librarian = userRepository.findById(librarianId)
                .orElseThrow(() ->
                        new RuntimeException("Librarian not found"));

        ReceiptNote receipt = ReceiptNote.builder()
                .receiptNumber(generateReceiptNumber())
                .supplier(dto.getSupplier())
                .note(dto.getNote())
                .createdAt(LocalDateTime.now())
                .librarian(librarian)
                .build();

        for (ReceiptItemCreateDto itemDto : dto.getItems()) {

            Publication publication =
                    publicationRepository.findById(
                            itemDto.getPublicationId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Publication not found"
                            )
                    );

            ReceiptItem item = ReceiptItem.builder()
                    .publication(publication)
                    .quantity(itemDto.getQuantity())
                    .location(itemDto.getLocation())
                    .receiptNote(receipt)
                    .build();

            receipt.getItems().add(item);

            for (int i = 0; i < itemDto.getQuantity(); i++) {

                BookInstance instance = BookInstance.builder()
                        .publication(publication)
                        .location(itemDto.getLocation())
                        .status(BookStatus.AVAILABLE)
                        .inventoryNumber(
                                generateInventoryNumber(publication)
                        )
                        .build();

                bookInstanceRepository.save(instance);
            }
        }

        ReceiptNote saved =
                receiptNoteRepository.save(receipt);

        List<ReceiptItemResponseDto> responseItems =
                saved.getItems()
                        .stream()
                        .map(item -> ReceiptItemResponseDto.builder()
                                .itemId(item.getItemId())
                                .publicationId(
                                        item.getPublication().getPublicationID()
                                )
                                .isbn(
                                        item.getPublication().getIsbn()
                                )
                                .bookTitle(
                                        item.getPublication()
                                                .getBook()
                                                .getTitle()
                                )
                                .quantity(item.getQuantity())
                                .location(item.getLocation())
                                .build()
                        ).toList();

        return ReceiptResponseDto.builder()
                .receiptId(saved.getReceiptId())
                .receiptNumber(saved.getReceiptNumber())
                .supplier(saved.getSupplier())
                .note(saved.getNote())
                .createdAt(saved.getCreatedAt())
                .librarianName(librarian.getName())
                .items(responseItems)
                .build();
    }

    private String generateReceiptNumber() {

        long count =
                receiptNoteRepository.count() + 1;

        return String.format(
                "PR-%d-%04d",
                LocalDateTime.now().getYear(),
                count
        );
    }

    private String generateInventoryNumber(
            Publication publication
    ) {

        long count = bookInstanceRepository
                .countByPublication_PublicationID(publication.getPublicationID());

        return "INV-" + publication.getIsbn() + "-" + String.format("%03d", count + 1);
    }
}
