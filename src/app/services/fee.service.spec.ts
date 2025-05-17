import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { FeeService } from './fee.service';
import { RequestFee } from '../models/request-fee';
import { RequestFeeUpdate } from '../models/request-fee-update';
import { FeeResponse } from '../models/fee-response';
import { TableEnum } from '../enums/table-enum';
import { CreditCardFlagEnum } from '../enums/credit-card-flag-enum';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('FeeService', () => {
  let service: FeeService;
  let httpTestingController: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['logout']);
    Object.defineProperty(authServiceMock, 'currentToken', {
      get: () => 'test-token',
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [
        FeeService,
        { provide: AuthService, useValue: authServiceMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(FeeService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('createFee', () => {
    it('should send a POST request with correct headers and body', () => {
      const testRequest: RequestFee = {
        numberTable: TableEnum.ONE,
        numberOfInstallments: 12,
        flag: CreditCardFlagEnum.MASTER_VISA,
        machineFee: 2.5,
        clientFee: 3.0
      };

      service.createFee(testRequest).subscribe();

      const req = httpTestingController.expectOne('/api/fees');
      expect(req.request.method).toEqual('POST');
      expect(req.request.headers.get('Content-Type')).toEqual('application/json');
      expect(req.request.headers.get('Authorization')).toEqual('Bearer test-token');
      expect(req.request.body).toEqual(testRequest);
    });

    it('should handle 409 conflict error', (done) => {
      const testRequest: RequestFeeUpdate = {
        id: 1,
        numberTable: TableEnum.TWO,
        numberOfInstallments: 6,
        flag: CreditCardFlagEnum.AMEX_ELO_HIPER,
        machineFee: 1.5,
        clientFee: 2.0
      };

      service.updateFee(testRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Fee already exists');
          done();
        }
      });

      const req = httpTestingController.expectOne('/api/fees');
      req.flush(null, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('findCardFeeByNumberOfInstallmentsAndFlag', () => {
    it('should send a GET request with correct parameters and headers', () => {
      const expectedResponse: FeeResponse = {
        id: 1,
        numberTable: TableEnum.ONE,
        numberOfInstallments: 3,
        flag: CreditCardFlagEnum.MASTER_VISA,
        machineFee: 1.0,
        clientFee: 1.5
      };

      service.findCardFeeByNumberOfInstallmentsAndFlag(
        TableEnum.ONE,
        3,
        CreditCardFlagEnum.MASTER_VISA
      ).subscribe(response => {
        expect(response).toEqual(expectedResponse);
      });

      const req = httpTestingController.expectOne(
        req => req.url === '/api/fees' &&
          req.params.get('numberTable') === 'ONE' &&
          req.params.get('numberOfInstallments') === '3' &&
          req.params.get('flag') === 'MASTER_VISA'
      );

      expect(req.request.method).toEqual('GET');
      expect(req.request.headers.get('Authorization')).toEqual('Bearer test-token');

      req.flush(expectedResponse);
    });

    it('should handle 404 not found error', (done) => {
      service.findCardFeeByNumberOfInstallmentsAndFlag(
        TableEnum.ONE,
        3,
        CreditCardFlagEnum.MASTER_VISA
      ).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (err) => {
          expect(err.message).toBe('Fee not found');
          done();
        }
      });

      const req = httpTestingController.expectOne(
        req => req.url === '/api/fees' &&
          req.params.get('numberTable') === 'ONE' &&
          req.params.get('numberOfInstallments') === '3' &&
          req.params.get('flag') === 'MASTER_VISA'
      );
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('should handle connection errors', (done) => {
      service.findCardFeeByNumberOfInstallmentsAndFlag(
        TableEnum.ONE,
        3,
        CreditCardFlagEnum.MASTER_VISA
      ).subscribe({
        next: () => fail('should have failed with network error'),
        error: (err) => {
          expect(err.message).toBe('Unable to connect to the server');
          done();
        }
      });

      const req = httpTestingController.expectOne(
        req => req.url === '/api/fees' &&
          req.params.get('numberTable') === 'ONE' &&
          req.params.get('numberOfInstallments') === '3' &&
          req.params.get('flag') === 'MASTER_VISA'
      );
      req.error(new ProgressEvent('network error'), { status: 0 });
    });
  });

  describe('getHeaders', () => {
    it('should return headers with authorization when token exists', () => {
      const headers = service['getHeaders']();
      expect(headers.get('Authorization')).toEqual('Bearer test-token');
      expect(headers.get('Content-Type')).toEqual('application/json');
    });

    it('should return headers without authorization when token is null', () => {
      Object.defineProperty(authServiceMock, 'currentToken', { get: () => null });
      const headers = service['getHeaders']();
      expect(headers.get('Authorization')).toBeNull();
      expect(headers.get('Content-Type')).toEqual('application/json');
    });
  });
});