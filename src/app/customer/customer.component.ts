import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../services/customer.service';
import { CustomerRequest } from '../models/customer-request';
import { CustomerResponse } from '../models/customer-response';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  searchForm: FormGroup;
  currentCustomer: CustomerResponse | null = null;
  message: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private authService: AuthService,
    private router: Router
  ) {
    this.customerForm = this.fb.group({
      customer: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.searchForm = this.fb.group({
      searchCustomer: ['', Validators.required]
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

  onSave(): void {
    if (this.customerForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    const request: CustomerRequest = this.customerForm.value;
    this.customerService.saveCustomer(request).subscribe({
      next: (response) => {
        this.message = response;
        this.errorMessage = '';
        this.customerForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.message = '';
      }
    });
  }

  onUpdate(): void {
    if (this.customerForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    const request: CustomerRequest = this.customerForm.value;
    this.customerService.updateCustomer(request).subscribe({
      next: (response) => {
        this.message = response;
        this.errorMessage = '';
        this.currentCustomer = { ...request }; // Update current customer with new data
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.message = '';
      }
    });
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.errorMessage = 'Please enter a customer name to search';
      return;
    }

    const customer = this.searchForm.get('searchCustomer')?.value;
    this.customerService.findCustomerByCustomer(customer).subscribe({
      next: (response) => {
        this.currentCustomer = response;
        this.customerForm.patchValue({
          customer: response.customer,
          email: response.email
        });
        this.message = 'Customer found';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.message = '';
        this.currentCustomer = null;
        this.customerForm.reset();
      }
    });
  }

  onClear(): void {
    this.customerForm.reset();
    this.searchForm.reset();
    this.currentCustomer = null;
    this.message = '';
    this.errorMessage = '';
  }
}