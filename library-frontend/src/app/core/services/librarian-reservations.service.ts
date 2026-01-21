import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReservationRow {
  reservationID: number;

  userID: number;
  userName: string;
  membershipNumber?: string;

  bookID: number;
  bookTitle: string;
  bookAuthor: string;

  reservedAt: string;
  expiresAt: string | null;

  status: 'PENDING' | 'FULFILLED' | 'EXPIRED' | 'CANCELED' | string;
  loanID: number | null;
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

export interface ReservationActivatePayload {
  reservationID: number;
}

@Injectable({ providedIn: 'root' })
export class LibrarianReservationsService {
  private http = inject(HttpClient);
  private baseUrl = '/api/reservations';

  getAll(page: number, size: number, sort: string): Observable<PageResponse<ReservationRow>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    return this.http.get<PageResponse<ReservationRow>>(`${this.baseUrl}/all`, { params });
  }

  searchByMembership(
    q: string,
    page: number,
    size: number,
    sort: string
  ): Observable<PageResponse<ReservationRow>> {
    const params = new HttpParams()
      .set('q', q)
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    return this.http.get<PageResponse<ReservationRow>>(
      `${this.baseUrl}/search-by-membership`,
      { params }
    );
  }

  activate(payload: ReservationActivatePayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/fulfill`, payload);
  }
}