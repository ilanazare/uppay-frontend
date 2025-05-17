import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { LoanRequest } from '../models/loan-request';
import { LoanResponse } from '../models/loan-response';
import { TableEnum } from '../enums/table-enum';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly apiUrl = '/api/loan';

  saveLoan(tableNumber: TableEnum, request: LoanRequest): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${tableNumber}`,
      request,
      { headers: this.getAuthHeader() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  findLoansByCustomer(customer: string): Observable<LoanResponse[]> {
    return this.http.get<LoanResponse[]>(
      `${this.apiUrl}/${customer}`,
      { headers: this.getAuthHeader() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private getAuthHeader(): { [header: string]: string } {
    const token = this.authService.currentToken;
    if (!token) {
      throw new Error('No authentication token available');
    }
    return { 'Authorization': `Bearer ${token}` };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
    
      errorMessage = `Error: ${error.error.message}`;
    } else {
    
      if (error.status === 404) {
        errorMessage = 'Customer not found';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized - please login again';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server';
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}