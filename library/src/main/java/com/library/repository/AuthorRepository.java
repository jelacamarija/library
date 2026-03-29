package com.library.repository;

import com.library.entity.Author;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.*;
import java.util.Optional;

public interface AuthorRepository extends JpaRepository<Author,Long> {

    Page<Author> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Optional<Author> findByNameIgnoreCase(String name);
}
