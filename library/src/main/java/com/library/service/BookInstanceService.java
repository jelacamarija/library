package com.library.service;

import com.library.entity.*;
import com.library.repository.BookInstanceRepository;
import com.library.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookInstanceService {

    private final BookInstanceRepository instanceRepository;
    private final PublicationRepository publicationRepository;

    public void addCopies(Long publicationId, int count){

        if (count <= 0) {
            throw new RuntimeException("Broj kopija mora biti veci od 0");
        }

        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new RuntimeException("Publikacija ne postoji"));

        for (int i = 0; i < count; i++) {
            BookInstance instance = BookInstance.builder()
                    .inventoryNumber(generateInventoryNumber(publication))
                    .status(BookStatus.AVAILABLE)
                    .location("DEFAULT")
                    .publication(publication)
                    .build();

            instanceRepository.save(instance);
        }
    }

    public long getAvailableCount(Long publicationId){
        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new RuntimeException("Publikacija ne postoji"));

        return instanceRepository.countByPublicationAndStatus(
                publication,
                BookStatus.AVAILABLE
        );
    }

    public void updateStatus(Long instanceId, BookStatus status){

        BookInstance instance = instanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Instanca ne postoji"));

        instance.setStatus(status);

        instanceRepository.save(instance);
    }

    private String generateInventoryNumber(Publication publication){
        return "INV-" + publication.getPublicationID() + "-" + System.currentTimeMillis();
    }
}