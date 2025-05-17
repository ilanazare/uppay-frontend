import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
    {path: 'fee', loadComponent: () => import('./fee/fee.component').then(m => m.FeeComponent),
        data: { preload: false }
    },
    {path: 'customer', loadComponent: () => import('./customer/customer.component').then(m => m.CustomerComponent),
        data: { preload: false }
    },
    {path: 'loan', loadComponent: () => import('./loan/loan.component').then(m => m.LoanComponent),
        data: { preload: false }
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];
