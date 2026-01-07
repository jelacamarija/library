import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponseDto = {
  name:string,
  email: string;
  role: string;
  token: string;
};

type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};



@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly ROLE_KEY = 'user_role';
  private readonly EMAIL_KEY = 'user_email';
  private readonly NAME_KEY='user_name';

  constructor(private http: HttpClient) {}

  login(body: LoginRequest): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>('/api/login', body).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
      localStorage.setItem(this.ROLE_KEY, res.role);
      localStorage.setItem(this.EMAIL_KEY, res.email);
      localStorage.setItem(this.NAME_KEY,res.name);
      })
    );
  }

 logout(): void {
  localStorage.removeItem(this.TOKEN_KEY);
  localStorage.removeItem(this.ROLE_KEY);
  localStorage.removeItem(this.EMAIL_KEY);
  localStorage.removeItem(this.NAME_KEY);
}

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): 'CLIENT' | 'LIBRARIAN' | null {
    return localStorage.getItem(this.ROLE_KEY) as any;
  }

  getName(): string | null {
  return localStorage.getItem(this.NAME_KEY);
}

getEmail(): string | null {
  return localStorage.getItem(this.EMAIL_KEY);
}

  hasRole(required: string | string[]): boolean {
    const role = this.getRole();
    if (!role) return false;
    const req = Array.isArray(required) ? required : [required];
    return req.includes(role);
  }

  register(body: RegisterRequest) {
  return this.http.post('/api/register', body);
  }
  
}
