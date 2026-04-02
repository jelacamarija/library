package com.library.controller;

import com.library.dto.BookCreateDto;
import com.library.dto.BookResponseDto;
import com.library.dto.BookUpdateDescriptionDto;
import com.library.dto.BookUserDto;
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

    private void checkLibrarian(HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");

        if (role == null || !role.equalsIgnoreCase("LIBRARIAN")) {
            throw new RuntimeException("Pristup dozvoljen samo bibliotekaru");
        }
    }


    @PostMapping("/create")
    public BookResponseDto create(@RequestBody BookCreateDto dto,
                                  HttpServletRequest request) {
        checkLibrarian(request);
        return bookService.createBook(dto);
    }



    @GetMapping("/{id}")
    public BookResponseDto getBookById(@PathVariable Long id) {

        return bookService.getById(id);
    }

    @PatchMapping("/{id}/description")
    public BookResponseDto updateDescription(@PathVariable Long id,
                                             @RequestBody BookUpdateDescriptionDto dto,
                                             HttpServletRequest request) {
        checkLibrarian(request);
        return bookService.updateDescription(id, dto);
    }


    @GetMapping("/all")
    public Page<BookResponseDto> getAll(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size) {

        return bookService.getAll(page, size);
    }

    @GetMapping("/search")
    public Page<BookResponseDto> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return bookService.search(query, page, size);
    }


    @GetMapping("/available")
    public Page<BookUserDto> getAvailableBooksForUser(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return bookService.getAvailableBooksForUser(page, size);
    }
}