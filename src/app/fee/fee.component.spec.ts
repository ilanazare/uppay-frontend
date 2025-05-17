// import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// import { FeeComponent } from './fee.component';
// import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
// import { FeeService } from '../services/fee.service';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { AuthService } from '../services/auth.service';
// import { CommonModule } from '@angular/common';
// import { of, throwError } from 'rxjs';
// import { TableEnum } from '../enums/table-enum';
// import { CreditCardFlagEnum } from '../enums/credit-card-flag-enum';
// import { RequestFee } from '../models/request-fee';
// import { RequestFeeUpdate } from '../models/request-fee-update';
// import { FeeResponse } from '../models/fee-response';
// import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// describe('FeeComponent', () => {
//   let component: FeeComponent;
//   let fixture: ComponentFixture<FeeComponent>;
//   let mockFeeService: jasmine.SpyObj<FeeService>;
//   let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
//   let mockAuthService: jasmine.SpyObj<AuthService>;

//   beforeEach(async () => {
//     mockFeeService = jasmine.createSpyObj('FeeService', [
//       'findCardFeeByNumberOfInstallmentsAndFlag',
//       'createFee',
//       'updateFee'
//     ]);
//     mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
//     mockAuthService = jasmine.createSpyObj('AuthService', ['logout']);

//     await TestBed.configureTestingModule({
//       imports: [
//         ReactiveFormsModule,
//         FormsModule,
//         CommonModule,
//         NoopAnimationsModule
//       ],
//       declarations: [FeeComponent],
//       providers: [
//         FormBuilder,
//         { provide: FeeService, useValue: mockFeeService },
//         { provide: MatSnackBar, useValue: mockSnackBar },
//         { provide: AuthService, useValue: mockAuthService }
//       ]
//     }).compileComponents();

//     fixture = TestBed.createComponent(FeeComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   describe('ngOnInit', () => {
//     it('should initialize forms and load all fees', () => {
//       spyOn(component, 'loadAllFees');
//       component.ngOnInit();
      
//       expect(component.feeForm).toBeDefined();
//       expect(component.searchForm).toBeDefined();
//       expect(component.loadAllFees).toHaveBeenCalled();
//     });
//   });

//   describe('loadAllFees', () => {
//     it('should load fees based on search criteria', () => {
//       const mockFee: FeeResponse = {
//         id: 1,
//         numberTable: TableEnum.ONE,
//         numberOfInstallments: 3,
//         flag: CreditCardFlagEnum.MASTER_VISA,
//         machineFee: 2.5,
//         clientFee: 3.0
//       };
      
//       mockFeeService.findCardFeeByNumberOfInstallmentsAndFlag.and.returnValue(of(mockFee));
      
//       component.searchForm.patchValue({
//         searchNumberTable: TableEnum.ONE,
//         searchNumberOfInstallments: 3,
//         searchFlag: CreditCardFlagEnum.MASTER_VISA
//       });
      
//       component.loadAllFees();
      
//       expect(mockFeeService.findCardFeeByNumberOfInstallmentsAndFlag).toHaveBeenCalledWith(
//         TableEnum.ONE,
//         3,
//         CreditCardFlagEnum.MASTER_VISA
//       );
//       expect(component.fees).toEqual([mockFee]);
//     });

//     it('should handle not found error', () => {
//       const error = new Error('Fee not found');
//       mockFeeService.findCardFeeByNumberOfInstallmentsAndFlag.and.returnValue(throwError(() => error));
      
//       component.loadAllFees();
      
//       expect(mockSnackBar.open).toHaveBeenCalledWith(
//         'No fees found with the specified criteria',
//         'Close',
//         { duration: 3000 }
//       );
//       expect(component.fees).toEqual([]);
//     });

//     it('should handle unauthorized error by logging out', () => {
//       const error = new Error('Unauthorized');
//       mockFeeService.findCardFeeByNumberOfInstallmentsAndFlag.and.returnValue(throwError(() => error));
      
//       component.loadAllFees();
      
//       expect(mockAuthService.logout).toHaveBeenCalled();
//       expect(mockSnackBar.open).toHaveBeenCalledWith(
//         'Unauthorized',
//         'Close',
//         { duration: 5000, panelClass: ['error-snackbar'] }
//       );
//     });
//   });

//   describe('onSubmit', () => {
//     it('should not submit if form is invalid', () => {
//       component.feeForm.patchValue({
//         numberTable: '',
//         numberOfInstallments: '',
//         flag: '',
//         machineFee: '',
//         clientFee: ''
//       });
      
//       component.onSubmit();
      
//       expect(mockFeeService.createFee).not.toHaveBeenCalled();
//       expect(mockFeeService.updateFee).not.toHaveBeenCalled();
//     });

//     describe('onSubmit', () => {
//       it('should create a new fee when not in edit mode', () => {
//         const mockRequest: RequestFee = {
//           numberTable: TableEnum.ONE,
//           numberOfInstallments: 3,
//           flag: CreditCardFlagEnum.MASTER_VISA,
//           machineFee: 2.5,
//           clientFee: 3.0
//         };
//         component.feeForm.patchValue(mockRequest);
//         mockFeeService.createFee.and.returnValue(of(void 0));
//         spyOn(component, 'loadAllFees');
//         spyOn(component, 'resetForm');
//         component.onSubmit();
//         expect(mockFeeService.createFee).toHaveBeenCalledWith(mockRequest);
//         expect(mockSnackBar.open).toHaveBeenCalledWith(
//           'Fee created successfully',
//           'Close',
//           { duration: 3000 }
//         );
//         expect(component.loadAllFees).toHaveBeenCalled();
//         expect(component.resetForm).toHaveBeenCalled();
//       });
//     });

//     it('should update fee when in edit mode', () => {
//       const mockRequest: RequestFeeUpdate = {
//         id: 1,
//         numberTable: TableEnum.ONE,
//         numberOfInstallments: 3,
//         flag: CreditCardFlagEnum.MASTER_VISA,
//         machineFee: 2.5,
//         clientFee: 3.0
//       };
      
//       component.isEditing = true;
//       component.currentFeeId = 1;
//       component.feeForm.patchValue(mockRequest);
//       mockFeeService.updateFee.and.returnValue(of('Fee updated successfully'));
//       spyOn(component, 'loadAllFees');
//       spyOn(component, 'resetForm');
      
//       component.onSubmit();
      
//       expect(mockFeeService.updateFee).toHaveBeenCalledWith(mockRequest);
//       expect(mockSnackBar.open).toHaveBeenCalledWith(
//         'Fee updated successfully',
//         'Close',
//         { duration: 3000 }
//       );
//       expect(component.loadAllFees).toHaveBeenCalled();
//       expect(component.resetForm).toHaveBeenCalled();
//     });

//     it('should handle errors during fee creation', () => {
//       const error = new Error('Creation failed');
//       component.feeForm.patchValue({
//         numberTable: TableEnum.ONE,
//         numberOfInstallments: 3,
//         flag: CreditCardFlagEnum.MASTER_VISA,
//         machineFee: 2.5,
//         clientFee: 3.0
//       });
      
//       mockFeeService.createFee.and.returnValue(throwError(() => error));
      
//       component.onSubmit();
      
//       expect(mockSnackBar.open).toHaveBeenCalledWith(
//         'Creation failed',
//         'Close',
//         { duration: 5000, panelClass: ['error-snackbar'] }
//       );
//     });
//   });

//   describe('onSearch', () => {
//     it('should trigger loadAllFees', () => {
//       spyOn(component, 'loadAllFees');
//       component.onSearch();
//       expect(component.loadAllFees).toHaveBeenCalled();
//     });
//   });

//   describe('editFee', () => {
//     it('should set form to edit mode and patch values', () => {
//       const mockFee: FeeResponse = {
//         id: 1,
//         numberTable: TableEnum.ONE,
//         numberOfInstallments: 3,
//         flag: CreditCardFlagEnum.MASTER_VISA,
//         machineFee: 2.5,
//         clientFee: 3.0
//       };
      
//       component.editFee(mockFee);
      
//       expect(component.isEditing).toBeTrue();
//       expect(component.currentFeeId).toBe(1);
//       expect(component.feeForm.value).toEqual({
//         numberTable: TableEnum.ONE,
//         numberOfInstallments: 3,
//         flag: CreditCardFlagEnum.MASTER_VISA,
//         machineFee: 2.5,
//         clientFee: 3.0
//       });
//     });
//   });

//   describe('resetForm', () => {
//     it('should reset form and clear edit mode', () => {
//       component.isEditing = true;
//       component.currentFeeId = 1;
//       component.feeForm.patchValue({
//         numberTable: TableEnum.ONE,
//         numberOfInstallments: 3,
//         flag: CreditCardFlagEnum.MASTER_VISA,
//         machineFee: 2.5,
//         clientFee: 3.0
//       });
      
//       component.resetForm();
      
//       expect(component.isEditing).toBeFalse();
//       expect(component.currentFeeId).toBeNull();
//       expect(component.feeForm.value).toEqual({
//         numberTable: null,
//         numberOfInstallments: null,
//         flag: null,
//         machineFee: null,
//         clientFee: null
//       });
//     });
//   });

//   describe('form validation', () => {
//     it('should validate required fields', () => {
//       const form = component.feeForm;
//       expect(form.valid).toBeFalse();
      
//       form.patchValue({
//         numberTable: TableEnum.ONE,
//         numberOfInstallments: 3,
//         flag: CreditCardFlagEnum.MASTER_VISA,
//         machineFee: 2.5,
//         clientFee: 3.0
//       });
      
//       expect(form.valid).toBeTrue();
//     });

//     it('should validate number of installments range', () => {
//       const control = component.feeForm.get('numberOfInstallments');
      
//       control?.setValue(0);
//       expect(control?.hasError('min')).toBeTrue();
      
//       control?.setValue(13);
//       expect(control?.hasError('max')).toBeTrue();
      
//       control?.setValue(6);
//       expect(control?.valid).toBeTrue();
//     });

//     it('should validate fee values are non-negative', () => {
//       const machineControl = component.feeForm.get('machineFee');
//       const clientControl = component.feeForm.get('clientFee');
      
//       machineControl?.setValue(-1);
//       clientControl?.setValue(-1);
      
//       expect(machineControl?.hasError('min')).toBeTrue();
//       expect(clientControl?.hasError('min')).toBeTrue();
      
//       machineControl?.setValue(0);
//       clientControl?.setValue(0);
      
//       expect(machineControl?.valid).toBeTrue();
//       expect(clientControl?.valid).toBeTrue();
//     });
//   });
// });