import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        LoginComponent // Import standalone component here instead of declaring it
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([]) // Replace RouterTestingModule with provideRouter
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values', () => {
    expect(component.loginForm.value).toEqual({
      username: '',
      password: ''
    });
  });

  it('should have required validators for both fields', () => {
    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');

    usernameControl?.setValue('');
    passwordControl?.setValue('');

    expect(usernameControl?.valid).toBeFalse();
    expect(passwordControl?.valid).toBeFalse();
    expect(usernameControl?.errors?.['required']).toBeTruthy();
    expect(passwordControl?.errors?.['required']).toBeTruthy();
  });

  it('should not call authService.login if form is invalid', () => {
    component.loginForm.setValue({ username: '', password: '' });
    component.onSubmit();
    
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should set isLoading to true when form is submitted', () => {
    component.loginForm.setValue({ username: 'test', password: 'password' });
    authService.login.and.returnValue(of(true));
    
    component.onSubmit();
    
    expect(component.isLoading).toBeFalse;
  });

  it('should call authService.login with form values when form is valid', () => {
    const testCredentials = { username: 'test', password: 'password' };
    component.loginForm.setValue(testCredentials);
    authService.login.and.returnValue(of(true));
    
    component.onSubmit();
    
    expect(authService.login).toHaveBeenCalledWith(testCredentials.username, testCredentials.password);
  });

  it('should navigate to home page on successful login', fakeAsync(() => {
    const testCredentials = { username: 'test', password: 'password' };
    component.loginForm.setValue(testCredentials);
    authService.login.and.returnValue(of(true));
    const navigateSpy = spyOn(router, 'navigate');
    
    component.onSubmit();
    tick();
    
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeNull();
  }));

  it('should set errorMessage and isLoading to false on login failure', fakeAsync(() => {
    const testCredentials = { username: 'test', password: 'password' };
    component.loginForm.setValue(testCredentials);
    const errorResponse = { message: 'Invalid credentials' };
    authService.login.and.returnValue(throwError(() => errorResponse));
    
    component.onSubmit();
    tick();
    
    expect(component.errorMessage).toBe(errorResponse.message);
    expect(component.isLoading).toBeFalse();
  }));

  it('should set default error message when error has no message', fakeAsync(() => {
    const testCredentials = { username: 'test', password: 'password' };
    component.loginForm.setValue(testCredentials);
    authService.login.and.returnValue(throwError(() => ({})));
    
    component.onSubmit();
    tick();
    
    expect(component.errorMessage).toBe('Login failed. Please try again.');
    expect(component.isLoading).toBeFalse();
  }));

  it('should reset isLoading even if the request fails', fakeAsync(() => {
    const testCredentials = { username: 'test', password: 'password' };
    component.loginForm.setValue(testCredentials);
    authService.login.and.returnValue(throwError(() => ({})));
    
    component.onSubmit();
    tick();
    
    expect(component.isLoading).toBeFalse();
  }));

  it('should provide access to form controls via getters', () => {
    expect(component.username).toBe(component.loginForm.get('username'));
    expect(component.password).toBe(component.loginForm.get('password'));
  });
});