import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { CustomerRequest } from '../models/customer-request';
import { CustomerResponse } from '../models/customer-response';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly apiUrl = '/api/customer';

  saveCustomer(request: CustomerRequest): Observable<string> {
    return this.http.post(this.apiUrl, request, {
      responseType: 'text',
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateCustomer(request: CustomerRequest): Observable<string> {
    return this.http.put(this.apiUrl, request, {
      responseType: 'text',
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  findCustomerByCustomer(customer: string): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/${encodeURIComponent(customer)}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  private getAuthHeaders(): { [header: string]: string } {
    const token = this.authService.currentToken;
    if (!token || this.authService.isTokenExpired(token)) {
      this.authService.logout()
      throw new Error('No authentication token available or token expired');
    }
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      
      errorMessage = `Error: ${error.error.message}`;
    } else {
      
      if (error.status === 404) {
        errorMessage = 'Customer not found';
      } else if (error.status === 409) {
        errorMessage = 'Customer already exists';
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}