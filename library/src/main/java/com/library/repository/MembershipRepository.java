package com.library.repository;

import com.library.entity.Client;
import com.library.entity.Membership;
import com.library.entity.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
public interface MembershipRepository extends JpaRepository<Membership,Long> {

    List<Membership> findByClientUserIDOrderByCreatedAtDesc(Long clientId);

    Optional<Membership> findFirstByClientUserIDOrderByCreatedAtDesc(Long clientId);

    Optional<Membership> findFirstByClientAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Client client,
            MembershipStatus status,
            LocalDate date1,
            LocalDate date2
    );

    boolean existsByClientAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Client client,
            MembershipStatus status,
            LocalDate date1,
            LocalDate date2
    );


    Optional<Membership> findFirstByClientOrderByCreatedAtDesc(Client client);
}


