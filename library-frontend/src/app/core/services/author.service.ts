import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Author {
  authorID: number;
  name: string;
  biography: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private http = inject(HttpClient);
  private baseUrl = '/api/authors';

  getAll(page: number, size: number): Observable<PageResponse<Author>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Author>>(this.baseUrl, { params });
  }

  search(name: string, page: number, size: number): Observable<PageResponse<Author>> {
    const params = new HttpParams()
      .set('name', name)
      .set('page', page)
      .set('size', size);

    return this.http.get<PageResponse<Author>>(`${this.baseUrl}/search`, { params });
  }

  create(payload: { name: string; biography: string }): Observable<Author> {
    return this.http.post<Author>(this.baseUrl, payload);
  }

  updateBiography(id: number, biography: string): Observable<Author> {
    return this.http.patch<Author>(`${this.baseUrl}/${id}/biography`, { biography });
  }

  getById(id: number): Observable<Author> {
    return this.http.get<Author>(`${this.baseUrl}/${id}`);
  }
}