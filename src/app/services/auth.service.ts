import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { JwtPayload } from '../models/jwt-payload';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly authUrl = '/api/auth/login';
  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());
  private isRefreshing = false;

  get token$(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  get currentToken(): string | null {
    return this.tokenSubject.value;
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.token$.pipe(
      map(token => !!token && !this.isTokenExpired(token))
    );
  }

  get username(): string | null {
    const token = this.currentToken;
    if (!token) return null;
    return this.decodeToken(token).sub;
  }

  get roles(): string[] {
    const token = this.currentToken;
    if (!token) return [];
    const payload = this.decodeToken(token);
    return payload.roles ? payload.roles.split(' ') : [];
  }

  login(username: string, password: string): Observable<boolean> {
    const request: LoginRequest = { username, password };
    return this.http.post<LoginResponse>(this.authUrl, request).pipe(
      tap(response => this.storeToken(response.token)),
      map(() => true),
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.clearToken();
    this.router.navigate(['/login']);
  }

  isTokenExpired(token: string): boolean {
    try {
      const { exp } = this.decodeToken(token);
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  }

  private storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.tokenSubject.next(token);
  }

  private clearToken(): void {
    localStorage.removeItem('auth_token');
    this.tokenSubject.next(null);
  }

  public getTokenFromStorage(): string | null {
    const token = localStorage.getItem('auth_token');
    return token && !this.isTokenExpired(token) ? token : null;
  }

  private decodeToken(token: string): JwtPayload {
    return jwtDecode<JwtPayload>(token);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      
      errorMessage = `Error: ${error.error.message}`;
    } else {
      
      if (error.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server';
      } else {
        errorMessage = `Error: ${error.status} - ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}