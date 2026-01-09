import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReservationRow {
  reservationID: number;

  userID: number;
  userName: string;

  bookID: number;
  bookTitle: string;
  bookAuthor: string;

  reservedAt: string;   // ISO
  expiresAt: string | null; // ISO | null

  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELED' | string;
  loanID: number | null;
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

export interface ReservationActivatePayload {
  reservationID: number;
  days: number;
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

  activate(payload: ReservationActivatePayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/activate`, payload);
  }
}
