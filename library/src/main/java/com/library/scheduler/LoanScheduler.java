package com.library.scheduler;


import com.library.entity.Loan;
import com.library.entity.LoanStatus;
import com.library.repository.LoanRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
public class LoanScheduler {

    private final LoanRepository loanRepository;

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void markExpiredLoans() {
        Date now = new Date();
        List<Loan> overdue = loanRepository.findByStatusAndDueDateBefore(LoanStatus.ACTIVE, now);

        for (Loan l : overdue) {
            l.setStatus(LoanStatus.EXPIRED);
        }
    }
}
