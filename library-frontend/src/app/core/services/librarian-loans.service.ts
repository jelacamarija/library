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

  loanedAt: string;
  dueDate: string;
  returnedAt: string | null;

  status: 'ACTIVE' | 'RETURNED' | string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface UserOption {
  userId: number;
  name: string;
  membershipNumber: string;
}

export interface BookOption {
  bookId: number;
  title: string;
  author: string;
  copiesAvailable?: number; 
}

export interface LoanCreateRequest {
  userId: number;
  bookId: number;
  reservationID?: number | null;
  days: number;
}

@Injectable({ providedIn: 'root' })
export class LibrarianLoansService {
  private http = inject(HttpClient);

  private baseUrl = '/api/loans';
  private usersUrl = '/api/users';
  private booksUrl = '/api/books';

  getAll(page: number, size: number, sort: string): Observable<PageResponse<LoanRow>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PageResponse<LoanRow>>(this.baseUrl, { params });
  }

  searchByMembership(q: string, page: number, size: number, sort: string): Observable<PageResponse<LoanRow>> {
    const params = new HttpParams().set('q', q).set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PageResponse<LoanRow>>(`${this.baseUrl}/search-by-membership`, { params });
  }

  returnLoan(loanId: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${loanId}/return`, {});
  }

  searchClientsByMembership(q: string, page = 0, size = 8): Observable<PageResponse<any>> {
    const params = new HttpParams().set('q', q).set('page', page).set('size', size);
    return this.http.get<PageResponse<any>>(`${this.usersUrl}/clients/search`, { params });
  }

  searchBooks(q: string, page = 0, size = 8): Observable<PageResponse<any>> {
    const params = new HttpParams().set('query', q).set('page', page).set('size', size);
    return this.http.get<PageResponse<any>>(`${this.booksUrl}/search`, { params });
  }

  createLoan(payload: LoanCreateRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, payload);
  }
}
