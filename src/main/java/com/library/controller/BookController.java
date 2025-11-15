package com.library.controller;


import com.library.dto.BookCreateRequestDto;
import com.library.dto.BookResponseDto;
import com.library.service.BookService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @PostMapping
    public BookResponseDto createBook(@RequestBody BookCreateRequestDto dto, HttpServletRequest request){

      String role= (String) request.getAttribute("userRole");

      if(!"LIBRARIAN".equals(role)){
          throw new RuntimeException("Nemate pravo pristupa — samo bibliotekar može dodati knjigu.");
      }

      return bookService.createBook(dto);
    }
}
