import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoanRow {
  loanId: number;

  userId: number;
  userName: string;
  membershipNumber: string | null;

  bookId: number;
  bookTitle: string;
  bookAuthor: string;

  reservationId: number | null;

  loanedAt: string;     // ISO string
  dueDate: string;      // ISO string
  returnedAt: string | null; // ISO string | null

  status: 'ACTIVE' | 'RETURNED' | string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-based)
  size: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class LibrarianLoansService {
  private http = inject(HttpClient);

  // Backend base
  private baseUrl = '/api/loans';

  // LISTA SVIH LOAN-OVA (LIBRARIAN)
  getAll(page: number, size: number, sort: string): Observable<PageResponse<LoanRow>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    return this.http.get<PageResponse<LoanRow>>(this.baseUrl, { params });
  }

  // SEARCH PO BROJU ČLANSKE
  searchByMembership(
    q: string,
    page: number,
    size: number,
    sort: string
  ): Observable<PageResponse<LoanRow>> {
    const params = new HttpParams()
      .set('q', q)
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    return this.http.get<PageResponse<LoanRow>>(`${this.baseUrl}/search-by-membership`, { params });
  }

    // VRAĆANJE KNJIGE
  returnLoan(loanId: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${loanId}/return`, {});
  }
}