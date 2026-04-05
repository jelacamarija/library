import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PublicationDto {
  publicationID: number;
  isbn: string;
  publisher: string;
  publishedYear: number;
  edition: string;
  language: string;
  bookID: number;
  bookTitle: string;
}

@Injectable({ providedIn: 'root' })
export class PublicationService {
  private http = inject(HttpClient);
  private baseUrl = '/api/publications';

  getByBook(bookId: number, page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}/book/${bookId}?page=${page}&size=${size}`);
  }

  create(payload: any) {
  return this.http.post('/api/publications/add', payload);
}

search(isbn: string) {
  return this.http.get<any>(`/api/publications/search?isbn=${isbn}`);
}

getById(id:number){
  return this.http.get<PublicationDto>('/api/publications/' + id);
}
}