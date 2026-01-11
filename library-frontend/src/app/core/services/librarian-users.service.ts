import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type UserRow = {
  userID: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  membershipNumber: string | null;
  membershipDate: string | null;
  active: boolean | null;
  isVerified: boolean | null;
};

@Injectable({ providedIn: 'root' })
export class LibrarianUsersService {
  private http = inject(HttpClient);

  // Ako već imaš environment api url, ubaci ga ovdje.
  private base = '/api/users';

  getAll(page: number, size: number): Observable<PageResponse<UserRow>> {
    return this.http.get<PageResponse<UserRow>>(
      `${this.base}/clients?page=${page}&size=${size}`
    );
  }

  searchByMembership(q: string, page: number, size: number): Observable<PageResponse<UserRow>> {
    return this.http.get<PageResponse<UserRow>>(
      `${this.base}/clients/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`
    );
  }

  updatePhone(userId: number, phoneNumber: string): Observable<UserRow> {
    return this.http.patch<UserRow>(`${this.base}/${userId}/phone`, { phoneNumber });
  }

  createUser(payload: { name: string; email: string; phoneNumber?: string | null }): Observable<string> {
    return this.http.post(`${this.base}/create`, payload, { responseType: 'text' });
  }
}
