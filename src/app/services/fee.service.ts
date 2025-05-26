import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { RequestFee } from '../models/request-fee';
import { RequestFeeUpdate } from '../models/request-fee-update';
import { FeeResponse } from '../models/fee-response';
import { TableEnum } from '../enums/table-enum';
import { CreditCardFlagEnum } from '../enums/credit-card-flag-enum';

@Injectable({
  providedIn: 'root'
})
export class FeeService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly baseUrl = '/api/fees';

  private getHeaders(): HttpHeaders {
    const token = this.authService.currentToken;
    if (!token || this.authService.isTokenExpired(token)) {
      this.authService.logout()
      throw new Error('No authentication token available or token expired');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  createFee(request: RequestFee): Observable<void> {
    return this.http.post<void>(
      this.baseUrl,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateFee(request: RequestFeeUpdate): Observable<string> {
    return this.http.put<string>(
      this.baseUrl,
      request,
      { headers: this.getHeaders(), responseType: 'text' as 'json' }
    ).pipe(
      catchError(this.handleError)
    );
  }
  
  findCardFeeByNumberOfInstallmentsAndFlag(
    numberTable: TableEnum,
    numberOfInstallments: number,
    flag: CreditCardFlagEnum
  ): Observable<FeeResponse> {
    if (!numberTable || !numberOfInstallments || !flag) {
      return throwError(() => new Error('All parameters are required'));
    }
    
    return this.http.get<FeeResponse>(
      this.baseUrl,
      {
        headers: this.getHeaders(),
        params: {
          numberTable: numberTable.toString(),
          numberOfInstallments: numberOfInstallments.toString(),
          flag: flag.toString()
        }
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Unauthorized - Please login again';
        this.authService.logout();
      } else if (error.status === 404) {
        errorMessage = 'Fee not found';
      } else if (error.status === 409) {
        errorMessage = 'Fee already exists';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server';
      } else {
        errorMessage = `Error: ${error.status} - ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}