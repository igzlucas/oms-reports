import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Import RouterModule
import { Observable, Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ClientService } from '../../../core/services/client.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { Client } from '../../../core/models/client.model';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmationModalComponent], // Add RouterModule here
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css']
})
export class ClientListComponent implements OnInit, OnDestroy {
  clients$: Observable<Client[]> = of([]);
  private empresaSub!: Subscription;
  isModalOpen = false;
  clientToDelete: string | null = null;

  constructor(
    private clientService: ClientService,
    private empresaService: EmpresaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.clients$ = this.empresaService.getEmpresa().pipe(
      switchMap(empresa => {
        if (empresa && empresa.id) {
          return this.clientService.getClientsByEmpresa(empresa.id);
        }
        return of([]);
      })
    );
  }

  ngOnDestroy(): void {
    if (this.empresaSub) {
      this.empresaSub.unsubscribe();
    }
  }

  editClient(id: string): void {
    this.router.navigate(['/dashboard/clients/edit', id]);
  }

  deleteClient(id: string): void {
    this.clientToDelete = id;
    this.isModalOpen = true;
  }

  onConfirmDelete(): void {
    if (this.clientToDelete) {
      this.clientService.deleteClient(this.clientToDelete).subscribe(() => {
        console.log('Cliente eliminado con éxito');
        this.isModalOpen = false;
        // You might want to refresh the list here
      }, (err: any) => {
        console.error('Error al eliminar el cliente', err);
        this.isModalOpen = false;
      });
    }
  }

  onCancelDelete(): void {
    this.isModalOpen = false;
  }

  navigateToAddClient(): void {
    this.router.navigate(['/dashboard/clients/new']);
  }
}
