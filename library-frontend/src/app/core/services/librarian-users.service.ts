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

export type ClientRow = {
  userID: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  membershipNumber: string | null;

  membershipStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELED' | null;

  isVerified: boolean | null;
};

export type LibrarianRow = {
  userID: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  employeeCode: string | null;

  isVerified: boolean | null;
};

@Injectable({ providedIn: 'root' })
export class LibrarianUsersService {
  private http = inject(HttpClient);

  private base = '/api/users';

  getAll(page: number, size: number): Observable<PageResponse<ClientRow>> {
    return this.http.get<PageResponse<ClientRow>>(
      `${this.base}/clients?page=${page}&size=${size}`
    );
  }

  searchByMembership(q: string, page: number, size: number): Observable<PageResponse<ClientRow>> {
    return this.http.get<PageResponse<ClientRow>>(
      `${this.base}/clients/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`
    );
  }

  updatePhone(userId: number, phoneNumber: string): Observable<ClientRow> {
    return this.http.patch<ClientRow>(`${this.base}/${userId}/phone`, { phoneNumber });
  }

  createUser(payload: { name: string; email: string; phoneNumber?: string | null }): Observable<string> {
    return this.http.post(`${this.base}/create`, payload, { responseType: 'text' });
  }

  getAllLibrarians(page: number, size: number): Observable<PageResponse<LibrarianRow>> {
    return this.http.get<PageResponse<LibrarianRow>>(
      `${this.base}/librarians?page=${page}&size=${size}`
    );
  }

  searchLibrarians(q: string, page: number, size: number): Observable<PageResponse<LibrarianRow>> {
    return this.http.get<PageResponse<LibrarianRow>>(
      `${this.base}/librarians/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`
    );
  }

  updateLibrarianPhone(userId: number, phoneNumber: string): Observable<LibrarianRow> {
    return this.http.patch<LibrarianRow>(
      `${this.base}/librarians/${userId}/phone`,
      { phoneNumber }
    );
  }

  createLibrarian(payload: {name: string; email: string; phoneNumber?: string | null;}): Observable<string> {
    return this.http.post(`${this.base}/create-librarian`,payload,{ responseType: 'text' });
  }

  activateMembershipCash(membershipNumber: string) {
    return this.http.post(`/api/memberships/cash`, { membershipNumber }, { responseType: 'text' });
  }
}
