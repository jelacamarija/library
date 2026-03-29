package com.library.controller;

import com.library.dto.*;
import com.library.service.BookInstanceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/instances")
@RequiredArgsConstructor
public class BookInstanceController {

    private final BookInstanceService bookInstanceService;

    private void checkLibrarian(HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");

        if (role == null || !role.equalsIgnoreCase("LIBRARIAN")) {
            throw new RuntimeException("Pristup dozvoljen samo bibliotekaru");
        }
    }

    // 🔹 CREATE
    @PostMapping
    public BookInstanceResponseDto create(@RequestBody BookInstanceCreateDto dto,
                                          HttpServletRequest request) {
        checkLibrarian(request);
        return bookInstanceService.create(dto);
    }

    // 🔹 GET BY ID
    @GetMapping("/{id}")
    public BookInstanceResponseDto getById(@PathVariable Long id) {
        return bookInstanceService.getById(id);
    }

    // 🔹 GET ALL
    @GetMapping
    public Page<BookInstanceResponseDto> getAll(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return bookInstanceService.getAll(page, size);
    }

    // 🔹 GET BY PUBLICATION
    @GetMapping("/publication/{publicationId}")
    public Page<BookInstanceResponseDto> getByPublication(@PathVariable Long publicationId,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size) {
        return bookInstanceService.getByPublication(publicationId, page, size);
    }

    // 🔹 UPDATE LOCATION
    @PatchMapping("/{id}/location")
    public BookInstanceResponseDto updateLocation(@PathVariable Long id,
                                                  @RequestBody BookInstanceUpdateLocationDto dto,
                                                  HttpServletRequest request) {
        checkLibrarian(request);
        return bookInstanceService.updateLocation(id, dto);
    }
}