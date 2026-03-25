package com.library.controller;

import com.library.dto.BookCreateRequestDto;
import com.library.dto.BookResponseDto;
import com.library.dto.BookUpdateDescriptionDto;
import com.library.service.BookService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @PostMapping("/create")
    public BookResponseDto createBook(@RequestBody BookCreateRequestDto dto,
                                      HttpServletRequest request) {

        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Samo bibliotekar može dodati knjigu.");
        }

        return bookService.createBook(dto);
    }

    @GetMapping
    public Page<BookResponseDto> getBooksPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return bookService.getBooksPaginated(page, size);
    }

    @GetMapping("/{id}")
    public BookResponseDto getBookById(@PathVariable Long id) {
        return bookService.getBookById(id);
    }

    @PutMapping("/{id}/description")
    public BookResponseDto updateDescription(@PathVariable Long id,
                                             @RequestBody BookUpdateDescriptionDto dto,
                                             HttpServletRequest request) {

        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Samo bibliotekar može mijenjati opis.");
        }

        return bookService.updateBookDescription(id, dto.getDescription());
    }

    @GetMapping("/search")
    public Page<BookResponseDto> searchBooks(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return bookService.searchBooks(query, page, size);
    }
}