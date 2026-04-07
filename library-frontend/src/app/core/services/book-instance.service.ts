import { Injectable, inject } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BookInstanceService {

  private http = inject(HttpClient);

  getByPublication(publicationId: number) {
    return this.http.get<any>(`/api/book-instances/publication/${publicationId}`);
  }

  updateStatus(id: number, status: string) {
    return this.http.put(`/api/book-instances/${id}/status?status=${status}`, {})
  }

  create(payload: { publicationId: number; location: string }) {
  return this.http.post('/api/book-instances', payload);
}

getAllFiltered(publicationId: number, q: string, status: string, page: number, size: number) {
  let params = new HttpParams()
    .set('page', page)
    .set('size', size);

  if (q) params = params.set('q', q);
  if (status) params = params.set('status', status);

  return this.http.get(`/api/book-instances/publication/${publicationId}`, { params });
}


}