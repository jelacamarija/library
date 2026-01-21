import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export type ReservationResponseDto = {
  reservationID: number;
  userID: number;
  bookID: number;

  bookTitle: string;
  bookAuthor: string;

  reservedAt: string;
  expiresAt: string;
  status: 'PENDING' | 'FULFILLED' | 'EXPIRED' | 'CANCELED' | string;
  loanID: number | null;
};

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = 'http://localhost:8080/api/reservations';

  private getHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  reserve(payload: { bookID: number }): Observable<ReservationResponseDto> {
    return this.http.post<ReservationResponseDto>(
      `${this.baseUrl}/reserve`,
      payload,
      this.getHeaders()
    );
  }

  getMyReservations(): Observable<ReservationResponseDto[]> {
    return this.http.get<ReservationResponseDto[]>(
      `${this.baseUrl}/my`,
      this.getHeaders()
    );
  }
  
  cancelReservation(reservationID: number): Observable<ReservationResponseDto> {
  return this.http.put<ReservationResponseDto>(
    `${this.baseUrl}/${reservationID}/cancel`,
    {},
    this.getHeaders()
  );
}
}
