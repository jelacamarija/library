import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponseDto = {
  email: string;
  role: string;
  token: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly ROLE_KEY = 'user_role';
  private readonly EMAIL_KEY = 'user_email';

  constructor(private http: HttpClient) {}

  login(body: LoginRequest): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>('/api/login', body).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.ROLE_KEY, res.role);
        localStorage.setItem(this.EMAIL_KEY, res.email);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  hasRole(required: string | string[]): boolean {
    const role = this.getRole();
    if (!role) return false;
    const req = Array.isArray(required) ? required : [required];
    return req.includes(role);
  }
}
