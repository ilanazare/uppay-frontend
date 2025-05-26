import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoanService } from '../services/loan.service';
import { LoanRequest } from '../models/loan-request';
import { LoanResponse } from '../models/loan-response';
import { TableEnum } from '../enums/table-enum';
import { CreditCardFlagEnum } from '../enums/credit-card-flag-enum';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-loan',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './loan.component.html',
  styleUrls: ['./loan.component.css']
})
export class LoanComponent implements OnInit {
  loanForm: FormGroup;
  customerLoans: LoanResponse[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  tableOptions = Object.values(TableEnum);
  creditCardFlags = Object.values(CreditCardFlagEnum);

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
    private authService: AuthService,
    private router: Router
  ) {
    this.loanForm = this.fb.group({
      tableNumber: [TableEnum, Validators.required],
      customer: ['', [Validators.required, Validators.minLength(1)]],
      flag: [CreditCardFlagEnum, Validators.required],
      purchaseValue: ['', [Validators.required, Validators.min(1)]],
      numberOfInstallments: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {}

  private handleAuthError(error: any): void {
    if (error.message === 'No authentication token available or token expired') {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  logout(event: Event): void {
    event.preventDefault(); // Previne o comportamento padrão do link
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.loanForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: LoanRequest = {
      customer: this.loanForm.value.customer,
      flag: this.loanForm.value.flag,
      purchaseValue: this.loanForm.value.purchaseValue,
      numberOfInstallments: this.loanForm.value.numberOfInstallments
    };

    this.loanService.saveLoan(this.loanForm.value.tableNumber, request)
      .subscribe({
        next: () => {
          this.successMessage = 'Loan request submitted successfully!';
          this.loanForm.reset({
            tableNumber: TableEnum.ONE,
            flag: CreditCardFlagEnum.MASTER_VISA,
            purchaseValue: 0,
            numberOfInstallments: 1
          });
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to submit loan request';
          this.isLoading = false;
        }
      });
  }

  onFindLoans(): void {
    const customer = this.loanForm.value.customer;
    if (!customer) {
      this.errorMessage = 'Please enter a customer name';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.customerLoans = [];

    this.loanService.findLoansByCustomer(customer)
      .subscribe({
        next: (loans) => {
          this.customerLoans = loans;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to fetch loans';
          this.isLoading = false;
        }
      });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}