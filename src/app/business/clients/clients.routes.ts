import { Routes } from '@angular/router';
import { ClientListComponent } from './client-list/client-list.component';
import { ClientFormComponent } from './client-form/client-form.component';

// Definimos las rutas para la gestión de clientes
export const CLIENTS_ROUTES: Routes = [
  {
    path: '', // Ruta raíz para /clients
    component: ClientListComponent,
    title: 'Lista de Clientes' // Título para la pestaña del navegador
  },
  {
    path: 'new',
    component: ClientFormComponent,
    title: 'Nuevo Cliente'
  },
  {
    path: ':id/edit', // Ruta para editar un cliente específico, ej: /clients/123/edit
    component: ClientFormComponent,
    title: 'Editar Cliente'
  }
];
