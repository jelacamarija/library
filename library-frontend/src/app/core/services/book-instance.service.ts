import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BookInstanceService {

  private http = inject(HttpClient);

  getByPublication(publicationId: number) {
    return this.http.get<any>(`/api/book-instances/publication/${publicationId}`);
  }

  updateStatus(id: number, status: string) {
    return this.http.patch(`/api/book-instances/${id}/status`, { status });
  }

  create(payload: { publicationId: number; location: string }) {
  return this.http.post('/api/book-instances', payload);
}


}