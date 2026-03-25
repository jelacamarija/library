package com.library.repository;

import com.library.entity.Publication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PublicationRepository extends JpaRepository<Publication, Long> {

    Optional<Publication> findByIsbn(String isbn);
}