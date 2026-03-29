package com.library.controller;


import com.library.dto.AuthorCreateDto;
import com.library.dto.AuthorResponseDto;
import com.library.dto.AuthorUpdateDto;
import com.library.service.AuthorService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
public class AuthorController {

    private final AuthorService authorService;

    private void checkLibrarian(HttpServletRequest request){
        String role=(String) request.getAttribute("userRole");

        if(!"LIBRARIAN".equals(role)){
            throw new RuntimeException("Nedovoljno ovlasti");
        }
    }

    @PostMapping
    public AuthorResponseDto create(@RequestBody AuthorCreateDto dto,
                                    HttpServletRequest request) {
        checkLibrarian(request);
        return authorService.createAuthor(dto);
    }

    @PatchMapping("/{id}/biography")
    public AuthorResponseDto updateBiography(@PathVariable Long id,
                                             @RequestBody AuthorUpdateDto dto,
                                             HttpServletRequest request) {
        checkLibrarian(request);
        return authorService.updateBiography(id, dto);
    }

    @GetMapping("/{id}")
    public AuthorResponseDto getById(@PathVariable Long id,
                                     HttpServletRequest request) {
        checkLibrarian(request);
        return authorService.getById(id);
    }

    @GetMapping
    public Page<AuthorResponseDto> getAll(@RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size,
                                          HttpServletRequest request) {
        checkLibrarian(request);
        return authorService.getAll(page, size);
    }

    @GetMapping("/search")
    public Page<AuthorResponseDto> search(@RequestParam String name,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size,
                                          HttpServletRequest request) {
        checkLibrarian(request);
        return authorService.search(name, page, size);
    }
}
