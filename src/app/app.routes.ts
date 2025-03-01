import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AuthenticatedGuard } from './core/guards/authenticated.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./shared/components/layout/layout.component'),
        children: [
            {
                path: 'reporte',
                loadComponent: () => import('./business/pages/reporte/reporte.component'),
                canActivate: [AuthGuard]
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./business/dashboard/dashboard.component'),
                canActivate: [AuthGuard], data: { roles: ['ROLE_ADMIN'] }
            },
            {
                path: 'profile',
                loadComponent: () => import('./business/profile/profile.component'),
                canActivate: [AuthGuard]
            },
            {
                path: 'tables',
                loadComponent: () => import('./business/tables/tables.component'),
                canActivate: [AuthGuard]
            },
            {
                path: 'clientes',
                loadComponent: () => import('./business/pages/customer/customer.component'),
                canActivate: [AuthGuard]
            },
            {
                path: 'configuracion/:configId',
                loadComponent: () => import('./business/pages/configuraciones/configuraciones.component'),
                canActivate: [RoleGuard], data: { roles: ['ROLE_ADMIN'] } 
            },
            {
                path: 'reportes',
                loadComponent: () => import('./business/pages/reportes-table/reportes-table.component'),
                canActivate: [RoleGuard], data: { roles: ['ROLE_ADMIN'] } 
            },
            {
                path: '',
                redirectTo: 'reporte',
                pathMatch: 'full'
            }

        ]
    },
    {
        path: 'login',
        loadComponent: ()=> import('./business/authentication/login/login.component'),
        canActivate: [AuthenticatedGuard]
    },
    {
        path: '**',
        redirectTo: '/login'
    }
];
