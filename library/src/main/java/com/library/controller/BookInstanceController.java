package com.library.controller;

import com.library.entity.BookStatus;
import com.library.service.BookInstanceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/instances")
@RequiredArgsConstructor
public class BookInstanceController {

    private final BookInstanceService instanceService;

    @PostMapping("/add")
    public String addCopies(@RequestParam Long publicationId,
                            @RequestParam int count,
                            HttpServletRequest request) {

        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Samo bibliotekar može dodati kopije.");
        }
        instanceService.addCopies(publicationId, count);
        return "Kopije uspešno dodate.";
    }

    @GetMapping("/available/{publicationId}")
    public long getAvailable(@PathVariable Long publicationId) {
        return instanceService.getAvailableCount(publicationId);
    }

    @PutMapping("/{instanceId}/status")
    public String updateStatus(@PathVariable Long instanceId,
                               @RequestParam BookStatus status,
                               HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (!"LIBRARIAN".equals(role)) {
            throw new RuntimeException("Samo bibliotekar može menjati status.");
        }
        instanceService.updateStatus(instanceId, status);
        return "Status promenjen.";
    }
}