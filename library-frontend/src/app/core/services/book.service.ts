import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookDto } from '../models/book.model';

export type PageDto<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-based)
  size: number;
};

@Injectable({ providedIn: 'root' })
export class BookService {
  constructor(private http: HttpClient) {}

  getPage(page = 0, size = 12): Observable<PageDto<BookDto>> {
    return this.http.get<PageDto<BookDto>>('/api/books', {
      params: { page, size },
    });
  }

  search(query: string, page = 0, size = 12) {
   return this.http.get<PageDto<BookDto>>('/api/books/search', {
      params: {query, page, size },
    });
  }

  create(payload: {
    title: string;
    author: string;
    isbn: string;
    category: string;
    publishedYear: number;
    copiesTotal: number;
    copiesAvailable: number;
    description: string;
  }) {
  return this.http.post<BookDto>('/api/books', payload);
  }


}
