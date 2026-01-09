import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoanResponseDto {
  loanId: number;
  userId: number;

  bookId: number;
  bookTitle: string;
  bookAuthor: string;

  reservationId?: number | null;

  loanedAt: string;
  dueDate?: string | null;
  returnedAt?: string | null;

  status: string;
}

@Injectable({ providedIn: 'root' })
export class LoanService {
  private http = inject(HttpClient);

  private baseUrl = '/api/loans';

  getMyLoans(): Observable<LoanResponseDto[]> {
    return this.http.get<LoanResponseDto[]>(`${this.baseUrl}/my`);
  }
}
