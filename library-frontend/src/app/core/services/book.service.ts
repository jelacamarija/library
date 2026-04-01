import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookDto } from '../models/book.model';
import { PublicationDto } from '../models/publication.model';
export type PageDto<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; 
  size: number;
};

@Injectable({ providedIn: 'root' })
export class BookService {
  constructor(private http: HttpClient) {}

  getPage(page = 0, size = 12): Observable<PageDto<BookDto>> {
    return this.http.get<PageDto<BookDto>>('/api/books/all', {
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
    description: string;
  }) {
  return this.http.post<BookDto>('/api/books/create', payload);
  }

  updateDescription(id: number, description: string) {
    return this.http.put<BookDto>('/api/books/' + id + '/description', { description });
}

  updateCopies(id: number, copiesToAdd: number) {
    return this.http.put<BookDto>('/api/books/' + id + '/copies', { copiesToAdd });
  }

  getById(id: number) {
  return this.http.get<BookDto>('/api/books/' + id);
}

getPublications(bookId: number) {
  return this.http.get<PublicationDto[]>(`/api/publications/book/${bookId}`);
}

reserveByPublication(publicationId: number) {
  return this.http.post(`/api/reservations/reserve-by-publication/${publicationId}`, {});
}

}
