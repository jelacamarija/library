package com.library.scheduler;

import com.library.entity.Membership;
import com.library.entity.MembershipStatus;
import com.library.repository.MembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MembershipScheduler {

    private final MembershipRepository membershipRepository;

    @Transactional
    @Scheduled(cron = "0 0 0 * * *")
    public void expireMemberships() {

        List<Membership> activeMemberships =
                membershipRepository.findByStatus(MembershipStatus.ACTIVE);

        LocalDate today = LocalDate.now();

        for (Membership m : activeMemberships) {
            if (m.getEndDate() != null && m.getEndDate().isBefore(today)) {
                m.setStatus(MembershipStatus.EXPIRED);
                membershipRepository.save(m);
            }
        }
    }

}
