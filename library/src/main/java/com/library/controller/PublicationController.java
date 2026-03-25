package com.library.controller;

import com.library.entity.Publication;
import com.library.service.PublicationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/publications")
@RequiredArgsConstructor
public class PublicationController {

    private final PublicationService publicationService;
    @PostMapping("/{bookId}")
    public Publication createPublication(@PathVariable Long bookId,
                                         @RequestBody Publication publication,
                                         HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Samo bibliotekar može dodati izdanje.");
        }
        return publicationService.createPublication(bookId, publication);
    }

    @GetMapping("/isbn/{isbn}")
    public Publication getByIsbn(@PathVariable String isbn) {
        return publicationService.getByIsbn(isbn);
    }
}