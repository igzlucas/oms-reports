import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./business/authentication/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(
        (m) => m.LayoutComponent
      ),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./business/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./business/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./business/pages/customer/customer.component').then(
            (m) => m.CustomerComponent
          ),
        canActivate: [roleGuard],
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./business/pages/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
      },
      {
        path: 'new-report', // <-- Ruta actualizada
        loadComponent: () =>
          import('./business/report-form/report-form.component').then(
            (m) => m.ReportFormComponent
          ),
      },
      {
        path: 'reports-table',
        loadComponent: () =>
          import(
            './business/pages/reportes-table/reportes-table.component'
          ).then((m) => m.ReportesTableComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
