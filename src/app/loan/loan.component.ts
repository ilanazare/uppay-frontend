import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoanService } from '../services/loan.service';
import { LoanRequest } from '../models/loan-request';
import { LoanResponse } from '../models/loan-response';
import { TableEnum } from '../enums/table-enum';
import { CreditCardFlagEnum } from '../enums/credit-card-flag-enum';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-loan',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './loan.component.html',
  styleUrls: ['./loan.component.css']
})
export class LoanComponent implements OnInit {
  loanForm: FormGroup;
  loans: LoanResponse[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  tableOptions = Object.values(TableEnum);
  flagOptions = Object.values(CreditCardFlagEnum);
  selectedTable: TableEnum = TableEnum.ONE;

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService
  ) {
    this.loanForm = this.fb.group({
      customer: ['', [Validators.required, Validators.minLength(3)]],
      flag: ['', Validators.required],
      numberOfInstallments: ['', [Validators.required, Validators.min(1)]],
      purchaseValue: ['', [Validators.required, Validators.min(0.01)]],
      tableNumber: [this.selectedTable, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadLoans();
  }

  onSubmit(): void {
    if (this.loanForm.invalid) {
      this.markFormGroupTouched(this.loanForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const request: LoanRequest = {
      customer: this.loanForm.value.customer,
      flag: this.loanForm.value.flag,
      numberOfInstallments: this.loanForm.value.numberOfInstallments,
      purchaseValue: this.loanForm.value.purchaseValue
    };

    this.loanService.saveLoan(this.loanForm.value.tableNumber, request)
      .pipe(
        catchError(error => {
          this.errorMessage = error.message || 'Failed to save loan';
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe(() => {
        this.successMessage = 'Loan saved successfully!';
        this.isLoading = false;
        this.loadLoans();
        this.loanForm.reset({
          tableNumber: this.selectedTable
        });
      });
  }

  loadLoans(): void {
    const customer = this.loanForm.get('customer')?.value;
    if (!customer) return;

    this.isLoading = true;
    this.errorMessage = null;

    this.loanService.findLoansByCustomer(customer)
      .pipe(
        catchError(error => {
          this.errorMessage = error.message || 'Failed to load loans';
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe(loans => {
        this.loans = loans;
        this.isLoading = false;
      });
  }

  onTableChange(table: TableEnum): void {
    this.selectedTable = table;
    this.loanForm.patchValue({ tableNumber: table });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}