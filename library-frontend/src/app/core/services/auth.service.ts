import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponseDto = {
  name: string;
  email: string;
  role: 'CLIENT' | 'LIBRARIAN';
  token: string;
};

export type UserProfileDto = {
  userID: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  membershipNumber: string | null;
  membershipDate: string | null; // ISO
  isVerified: boolean;
  active: boolean;
  createdAt: string;             // ISO
  role: 'CLIENT' | 'LIBRARIAN';
}



type RegisterRequest = {
  name: string;
  email: string;
  phoneNumber:string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly ROLE_KEY = 'user_role';
  private readonly EMAIL_KEY = 'user_email';
  private readonly NAME_KEY = 'user_name';

  
  private storage: Storage = sessionStorage;

  constructor(private http: HttpClient) {}

  login(body: LoginRequest): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>('/api/login', body).pipe(
      tap((res) => {
        this.storage.setItem(this.TOKEN_KEY, res.token);
        this.storage.setItem(this.ROLE_KEY, res.role);
        this.storage.setItem(this.EMAIL_KEY, res.email);
        this.storage.setItem(this.NAME_KEY, res.name);
      })
    );
  }

    getMyProfile() {
  return this.http.get<UserProfileDto>('/api/users/me');
  }

  logout(): void {
    this.storage.removeItem(this.TOKEN_KEY);
    this.storage.removeItem(this.ROLE_KEY);
    this.storage.removeItem(this.EMAIL_KEY);
    this.storage.removeItem(this.NAME_KEY);
  }

  getToken(): string | null {
    return this.storage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.storage.getItem(this.TOKEN_KEY);
  }

  getRole(): 'CLIENT' | 'LIBRARIAN' | null {
    const r = this.storage.getItem(this.ROLE_KEY);
    return (r === 'CLIENT' || r === 'LIBRARIAN') ? r : null;
  }

  getName(): string | null {
    return this.storage.getItem(this.NAME_KEY);
  }

  getEmail(): string | null {
    return this.storage.getItem(this.EMAIL_KEY);
  }

  hasRole(required: string | string[]): boolean {
    const role = this.getRole();
    if (!role) return false;
    const req = Array.isArray(required) ? required : [required];
    return req.includes(role);
  }

  register(body: RegisterRequest) {
  return this.http.post('/api/register', body, {
    responseType: 'text' as const,
  });
}


  
  clearLegacyLocalStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
    localStorage.removeItem(this.NAME_KEY);
  }
}
