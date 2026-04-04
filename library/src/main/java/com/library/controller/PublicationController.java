package com.library.controller;

import com.library.dto.PublicationCreateDto;
import com.library.dto.PublicationResponseDto;
import com.library.entity.Publication;
import com.library.service.PublicationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/publications")
@RequiredArgsConstructor
public class PublicationController {

    private final PublicationService publicationService;

    private void checkLibrarian(HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");

        if (role == null || !role.equalsIgnoreCase("LIBRARIAN")) {
            throw new RuntimeException("Pristup dozvoljen samo bibliotekaru");
        }
    }

    @PostMapping("/add")
    public PublicationResponseDto createPublication(@RequestBody PublicationCreateDto dto,
                                                    HttpServletRequest request) {
       checkLibrarian(request);
       return publicationService.createPublication(dto);
    }

    @GetMapping("/{id}")
    public PublicationResponseDto getById(@PathVariable Long id) {
        return publicationService.getById(id);
    }

    @GetMapping("/all")
    public Page<PublicationResponseDto> getAll(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        return publicationService.getAll(page, size);
    }

    @GetMapping("/search")
    public Page<PublicationResponseDto> search(@RequestParam String isbn,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        return publicationService.searchByIsbn(isbn, page, size);
    }

    @GetMapping("/book/{bookId}")
    public Page<PublicationResponseDto> getByBook(@PathVariable Long bookId,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        return publicationService.getByBook(bookId, page, size);
    }

    @GetMapping("/book/{bookId}/available")
    public Page<PublicationResponseDto> getAvailableByBook(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return publicationService.getAvailableByBook(bookId, page, size);
    }
}