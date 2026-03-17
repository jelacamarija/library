package com.library.repository;

import com.library.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client,Long> {
    Optional<Client> findByEmail(String email);

    Optional<Client> findByMembershipNumber(String membershipNumber);

    boolean existsByMembershipNumber(String membershipNumber);

    Page<Client> findByMembershipNumberContainingIgnoreCase(String q, Pageable pageable);

    Page<Client> findByNameContainingIgnoreCase(String q, Pageable pageable);

    Page<Client> findByEmailContainingIgnoreCase(String q, Pageable pageable);
}
