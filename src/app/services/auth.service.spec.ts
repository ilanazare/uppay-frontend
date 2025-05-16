import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { JwtPayload } from '../models/jwt-payload';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  // Mock data
  const mockToken = 'mock.jwt.token';
  const mockLoginRequest: LoginRequest = { username: 'testuser', password: 'password' };
  const mockLoginResponse: LoginResponse = { token: mockToken };
  const mockPayload: JwtPayload = {
    sub: 'testuser',
    roles: 'admin user',
    exp: Date.now() / 1000 + 3600, // 1 hour from now
    iat: Date.now() / 1000,
    iss: 'test-issuer'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]) // Replace RouterTestingModule with provideRouter
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    
    // Clear localStorage before each test
    localStorage.clear();
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');
    spyOn(localStorage, 'getItem');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should make a POST request to login endpoint and store token on success', () => {
      service.login(mockLoginRequest.username, mockLoginRequest.password).subscribe({
        next: (result) => {
          expect(result).toBeTrue();
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockLoginRequest);
      req.flush(mockLoginResponse);

      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
    });

    it('should handle login error', () => {
      const errorResponse = {
        status: 401,
        statusText: 'Unauthorized'
      };

      service.login(mockLoginRequest.username, mockLoginRequest.password).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Invalid username or password');
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush('Invalid credentials', errorResponse);
    });
  });

  describe('logout', () => {
    it('should clear token and navigate to login', () => {
      spyOn(router, 'navigate');
      
      // Set a token first
      service['tokenSubject'].next(mockToken);
      
      service.logout();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(service['tokenSubject'].value).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('token management', () => {
    it('should get current token', () => {
      service['tokenSubject'].next(mockToken);
      expect(service.currentToken).toBe(mockToken);
    });

    it('should get token from storage when valid', () => {
      const validToken = 'valid.token';
      const payload: JwtPayload = {
        ...mockPayload,
        exp: Date.now() / 1000 + 3600 // Not expired
      };
      
      spyOn(service as any, 'decodeToken').and.returnValue(payload);
      (localStorage.getItem as jasmine.Spy).and.returnValue(validToken);
      
      const token = service['getTokenFromStorage']();
      expect(token).toBe(validToken);
    });

    it('should return null when token is expired', () => {
      const expiredToken = 'expired.token';
      const payload: JwtPayload = {
        ...mockPayload,
        exp: Date.now() / 1000 - 3600 // Expired
      };
      
      spyOn(service as any, 'decodeToken').and.returnValue(payload);
      (localStorage.getItem as jasmine.Spy).and.returnValue(expiredToken);
      
      const token = service['getTokenFromStorage']();
      expect(token).toBeNull();
    });

    it('should return null when no token in storage', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      const token = service['getTokenFromStorage']();
      expect(token).toBeNull();
    });
  });

  describe('token expiration', () => {
    it('should detect expired token', () => {
      const expiredToken = 'expired.token';
      const payload: JwtPayload = {
        ...mockPayload,
        exp: Date.now() / 1000 - 3600 // Expired
      };
      
      spyOn(service as any, 'decodeToken').and.returnValue(payload);
      expect(service.isTokenExpired(expiredToken)).toBeTrue();
    });

    it('should detect valid token', () => {
      const validToken = 'valid.token';
      const payload: JwtPayload = {
        ...mockPayload,
        exp: Date.now() / 1000 + 3600 // Not expired
      };
      
      spyOn(service as any, 'decodeToken').and.returnValue(payload);
      expect(service.isTokenExpired(validToken)).toBeFalse();
    });

    it('should handle invalid token', () => {
      spyOn(service as any, 'decodeToken').and.throwError('Invalid token');
      expect(service.isTokenExpired('invalid.token')).toBeTrue();
    });
  });

  describe('user information', () => {
    it('should get username from token', () => {
      service['tokenSubject'].next(mockToken);
      spyOn(service as any, 'decodeToken').and.returnValue(mockPayload);
      
      expect(service.username).toBe(mockPayload.sub);
    });

    it('should return null username when no token', () => {
      service['tokenSubject'].next(null);
      expect(service.username).toBeNull();
    });

    it('should get roles from token', () => {
      service['tokenSubject'].next(mockToken);
      spyOn(service as any, 'decodeToken').and.returnValue(mockPayload);
      
      expect(service.roles).toEqual(['admin', 'user']);
    });

    it('should return empty array when no token', () => {
      service['tokenSubject'].next(null);
      expect(service.roles).toEqual([]);
    });
  });

  describe('authentication state', () => {
    it('should emit false when not logged in', fakeAsync(() => {
      service['tokenSubject'].next(null);
      
      let isLoggedIn: boolean | undefined;
      service.isLoggedIn$.subscribe(value => isLoggedIn = value);
      tick();
      
      expect(isLoggedIn).toBeFalse();
    }));

    it('should emit true when logged in with valid token', fakeAsync(() => {
      service['tokenSubject'].next(mockToken);
      spyOn(service as any, 'decodeToken').and.returnValue(mockPayload);
      
      let isLoggedIn: boolean | undefined;
      service.isLoggedIn$.subscribe(value => isLoggedIn = value);
      tick();
      
      expect(isLoggedIn).toBeTrue();
    }));

    it('should emit false when token is expired', fakeAsync(() => {
      const expiredPayload: JwtPayload = {
        ...mockPayload,
        exp: Date.now() / 1000 - 3600 // Expired
      };
      
      service['tokenSubject'].next(mockToken);
      spyOn(service as any, 'decodeToken').and.returnValue(expiredPayload);
      
      let isLoggedIn: boolean | undefined;
      service.isLoggedIn$.subscribe(value => isLoggedIn = value);
      tick();
      
      expect(isLoggedIn).toBeFalse();
    }));
  });

  describe('error handling', () => {
    it('should handle network errors', () => {
      service.login(mockLoginRequest.username, mockLoginRequest.password).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Unable to connect to the server');
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.error(new ProgressEvent('network error'), { status: 0 });
    });

    it('should handle other HTTP errors', () => {
      const errorResponse = {
        status: 500,
        statusText: 'Internal Server Error'
      };

      service.login(mockLoginRequest.username, mockLoginRequest.password).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Error: 500');
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush('Server error', errorResponse);
    });
  });
});