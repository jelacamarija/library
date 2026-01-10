package com.library.repository;

import com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByVerifyCode(String verifyCode);

    Optional<User> findByMembershipNumber(String membershipNumber);
    Page<User> findByRole(String role, Pageable pageable);
    Page<User> findByRoleAndMembershipNumberContainingIgnoreCase(String role, String q, Pageable pageable);
}
