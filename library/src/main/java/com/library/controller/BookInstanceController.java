package com.library.controller;

import com.library.dto.*;
import com.library.entity.BookStatus;
import com.library.service.BookInstanceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/book-instances")
@RequiredArgsConstructor
public class BookInstanceController {

    private final BookInstanceService bookInstanceService;


    @PostMapping
    public BookInstanceResponseDto create(@RequestBody BookInstanceCreateDto dto,
                                          HttpServletRequest request) {

        String role = (String) request.getAttribute("userRole");

        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Samo bibliotekar može dodavati primjerke");
        }

        return bookInstanceService.create(dto);
    }


    @GetMapping("/{id}")
    public BookInstanceResponseDto getById(@PathVariable Long id) {
        return bookInstanceService.getById(id);
    }


    @GetMapping
    public Page<BookInstanceResponseDto> getAll(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return bookInstanceService.getAll(page, size);
    }


    @GetMapping("/publication/{publicationId}")
    public Page<BookInstanceResponseDto> searchInstances(
            @PathVariable Long publicationId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BookStatus status,
            @RequestParam int page,
            @RequestParam int size
    ) {
        return bookInstanceService.search(publicationId, q, status, page, size);
    }


    @PatchMapping("/{id}/location")
    public BookInstanceResponseDto updateLocation(@PathVariable Long id,
                                                  @RequestBody BookInstanceUpdateLocationDto dto,
                                                  HttpServletRequest request) {

        String role = (String) request.getAttribute("userRole");

        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Samo bibliotekar može mijenjati lokaciju");
        }

        return bookInstanceService.updateLocation(id, dto);
    }


    @GetMapping("/search")
    public BookInstanceResponseDto getByInventoryNumber(@RequestParam String inventoryNumber) {
        return bookInstanceService.getByInventoryNumber(inventoryNumber);
    }


    @GetMapping("/book/{bookId}/available-count")
    public long countAvailableByBook(@PathVariable Long bookId) {
        return bookInstanceService.countAvailableByBook(bookId);
    }


    @PatchMapping("/{id}/status")
    public BookInstanceResponseDto updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateDto dto,
            HttpServletRequest request) {

        String role = (String) request.getAttribute("userRole");

        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Samo bibliotekar može mijenjati status");
        }

        return bookInstanceService.markAsDamagedOrLost(id, dto.getStatus());
    }

    @GetMapping("/book/{bookId}/available-user")
    public Page<BookInstanceUserDto> getAvailableInstancesForUser(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return bookInstanceService.getAvailableInstancesForUser(bookId, page, size);
    }
}