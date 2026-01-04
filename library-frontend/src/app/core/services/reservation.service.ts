import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:8080/api/reservations'; // prilagodi ako treba

  reserve(payload: { bookID: number }): Observable<ReservationResponseDto> {
    return this.http.post<ReservationResponseDto>(
      `${this.baseUrl}/reserve`,
      payload
    );
  }
}

export interface ReservationResponseDto {
  reservationID: number;
  userID: number;
  bookID: number;
  bookTitle: string;
  reservedAt: string;
  expiresAt: string;
  status: string;
  loanID?: number;
}
