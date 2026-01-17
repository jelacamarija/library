package com.library.controller;


import com.library.dto.BookCreateRequestDto;
import com.library.dto.BookResponseDto;
import com.library.dto.BookUpdateCopiesDto;
import com.library.dto.BookUpdateDescriptionDto;
import com.library.service.BookService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;


@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @PostMapping("/create")
    public BookResponseDto createBook(@Valid @RequestBody BookCreateRequestDto dto, HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Nemate pravo pristupa — samo bibliotekar može dodati knjigu.");
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
    public BookResponseDto getBookById(@PathVariable Long id,
                                       HttpServletRequest request) {
        return bookService.getBookById(id);
    }

    @PutMapping("/{id}/copies")
    public BookResponseDto updateCopies(@PathVariable Long id,
                                        @RequestBody BookUpdateCopiesDto dto,
                                        HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Nemate pravo pristupa — samo bibliotekar može menjati kopije.");
        }
        return bookService.updateBookCopies(id, dto.getCopiesToAdd());
    }

    @PutMapping("/{id}/description")
    public BookResponseDto updateDescription(@PathVariable Long id,
                                             @RequestBody BookUpdateDescriptionDto dto,
                                             HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Nemate pravo pristupa — samo bibliotekar može menjati opis knjige.");
        }
        return bookService.updateBookDescription(id, dto.getDescription());
    }

    @GetMapping("/search")
    public Page<BookResponseDto> searchBooks( @RequestParam String query,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size,
                                              HttpServletRequest request){
        return bookService.searchBooks(query,page,size);
    }

    /*@GetMapping("/filter")
    public Page<BookResponseDto> filterByCategory(@RequestParam String category,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size){
        return bookService.filterByCategory(category,page,size);
    }

    @GetMapping("/sort")
    public Page<BookResponseDto> sortBooksByYear(
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return bookService.sortByYear(direction, page, size);
    }

    @GetMapping("/filter-sort")
    public Page<BookResponseDto> filterByCategoryAndSort(
            @RequestParam String category,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return bookService.filterByCategoryAndSort(category, direction, page, size);
    }*/


}
