import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeeService } from '../services/fee.service';
import { TableEnum } from '../enums/table-enum';
import { CreditCardFlagEnum } from '../enums/credit-card-flag-enum';
import { RequestFee } from '../models/request-fee';
import { RequestFeeUpdate } from '../models/request-fee-update';
import { FeeResponse } from '../models/fee-response';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fee',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './fee.component.html',
  styleUrls: ['./fee.component.css']
})
export class FeeComponent implements OnInit {
  feeForm: FormGroup;
  searchForm: FormGroup;
  tableOptions = Object.values(TableEnum);
  flagOptions = Object.values(CreditCardFlagEnum);
  installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  fees: FeeResponse[] = [];
  isEditing = false;
  currentFeeId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private feeService: FeeService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.feeForm = this.fb.group({
      numberTable: ['', Validators.required],
      numberOfInstallments: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      flag: ['', Validators.required],
      machineFee: ['', [Validators.required, Validators.min(0)]],
      clientFee: ['', [Validators.required, Validators.min(0)]]
    });

    this.searchForm = this.fb.group({
      searchNumberTable: [''],
      searchNumberOfInstallments: [''],
      searchFlag: ['']
    });
  }

  ngOnInit(): void {
    this.loadAllFees();
  }

  loadAllFees(): void {
    this.feeService.findCardFeeByNumberOfInstallmentsAndFlag(
      this.searchForm.value.searchNumberTable,
      this.searchForm.value.searchNumberOfInstallments,
      this.searchForm.value.searchFlag
    ).subscribe({
      next: (fee) => {
        this.fees = [fee];
      },
      error: (err) => {
        if (err.message.includes('not found')) {
          this.fees = [];
          this.snackBar.open('No fees found with the specified criteria', 'Close', { duration: 3000 });
        } else {
          this.handleError(err);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.feeForm.invalid) {
      return;
    }

    if (this.isEditing && this.currentFeeId) {
      const updateRequest: RequestFeeUpdate = {
        id: this.currentFeeId,
        ...this.feeForm.value
      };
      this.feeService.updateFee(updateRequest).subscribe({
        next: (message) => {
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.resetForm();
          this.loadAllFees();
        },
        error: (err) => this.handleError(err)
      });
    } else {
      const createRequest: RequestFee = this.feeForm.value;
      this.feeService.createFee(createRequest).subscribe({
        next: () => {
          this.snackBar.open('Fee created successfully', 'Close', { duration: 3000 });
          this.resetForm();
          this.loadAllFees();
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  onSearch(): void {
    this.loadAllFees();
  }

  editFee(fee: FeeResponse): void {
    this.isEditing = true;
    this.currentFeeId = fee.id;
    this.feeForm.patchValue({
      id: fee.id,
      numberTable: fee.numberTable,
      numberOfInstallments: fee.numberOfInstallments,
      flag: fee.flag,
      machineFee: fee.machineFee,
      clientFee: fee.clientFee
    });
  }

  resetForm(): void {
    this.feeForm.reset();
    this.isEditing = false;
    this.currentFeeId = null;
  }

  private handleError(error: Error): void {
    let errorMessage = error.message || 'An unknown error occurred';
    
    if (errorMessage.includes('Unauthorized')) {
      this.authService.logout();
    }

    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}