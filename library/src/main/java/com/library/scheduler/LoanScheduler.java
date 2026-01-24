package com.library.scheduler;


import com.library.entity.Loan;
import com.library.entity.LoanStatus;
import com.library.repository.LoanRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class LoanScheduler {

    private final LoanRepository loanRepository;

    @Scheduled(cron = "0 */2 * * * *")
    @Transactional
    public void markExpiredLoans() {
        LocalDateTime now = LocalDateTime.now();
        List<Loan> overdue = loanRepository.findByStatusAndDueDateBefore(LoanStatus.ACTIVE, now);

        for (Loan l : overdue) {
            l.setStatus(LoanStatus.EXPIRED);
        }
    }
}
