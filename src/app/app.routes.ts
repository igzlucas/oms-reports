import { Routes } from '@angular/router';
import { DashboardComponent } from './business/dashboard/dashboard.component';
import { ReportesTableComponent } from './business/pages/reportes-table/reportes-table.component';
import { ReportViewerComponent } from './business/report-viewer/report-viewer.component';
import { ReportAuthComponent } from './business/report-auth/report-auth.component';
import { ClientListComponent } from './business/clients/client-list/client-list.component';
import { ClientFormComponent } from './business/clients/client-form/client-form.component';
import { ReportFormComponent } from './business/report-form/report-form.component';
import { LoginComponent } from './business/authentication/login/login.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { CustomerComponent } from './business/pages/customer/customer.component';
import { ProfileComponent } from './business/profile/profile.component'; // Importa el componente de perfil

export const routes: Routes = [
    // Rutas públicas
    { path: 'login', component: LoginComponent },
    { path: 'report-viewer/:token', component: ReportAuthComponent },
    { path: 'report-viewer/:token/view', component: ReportViewerComponent },

    // Rutas privadas con layout principal
    {
        path: '',
        component: LayoutComponent,
        canActivate: [AuthGuard], // Protege todas las rutas hijas
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'profile', component: ProfileComponent }, // <-- RUTA AÑADIDA
            { path: 'customers', component: CustomerComponent },
            { path: 'customers/:id', component: CustomerComponent },
            
            // Rutas de Clientes
            { path: 'clients', component: ClientListComponent },
            { path: 'clients/new', component: ClientFormComponent },
            { path: 'clients/:id/edit', component: ClientFormComponent },
            
            // Rutas de Reportes
            { path: 'new-report', component: ReportFormComponent },
            { path: 'reports/:id', component: ReportFormComponent }, 
            { path: 'reports-table', component: ReportesTableComponent },
        ]
    },

    // Redirección para rutas no encontradas
    { path: '**', redirectTo: 'login' }
];
