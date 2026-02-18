import { Component, OnInit } from '@angular/core';
import { CustomersService } from '../../../core/services/customers.service';
import { Customer, CustomerRequest } from '../../../core/models/customer.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent],
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
  providers: [CustomersService]
})
export class CustomerComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  searchTerm: string = '';
  currentCustomerId: string = '';
  newCustomer: CustomerRequest = { nombre: '', direccion: '', email: '', telefono: '' };
  isModalOpen: boolean = false;
  isModalOpenCreate: boolean = false;
  isModalOpenDelete: boolean = false;
  alertVisible: boolean = false;
  alertMessage: string = '';
  alertType: 'error' | 'success' | 'warning' | 'info' = 'info';
  dropdownOpen: boolean = false;
  isLoading: boolean = true;

  constructor(private customerService: CustomersService) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getCustomers().subscribe(
      (data: Customer[]) => {
        this.customers = data;
        this.filteredCustomers = data;
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Error fetching customers:', error);
        this.isLoading = false;
      }
    );
  }

  filterCustomers(): void {
    this.filteredCustomers = this.customers.filter(customer =>
      customer.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openModal(customer: Customer, event: Event): void {
    event.stopPropagation();
    this.currentCustomerId = customer.id;
    this.newCustomer = { ...customer };
    this.isModalOpen = true;
  }

  openModalCreate(event: Event): void {
    event.stopPropagation();
    this.newCustomer = { nombre: '', direccion: '', telefono: '', email: '' };
    this.isModalOpenCreate = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  closeModalCreate(): void {
    this.isModalOpenCreate = false;
  }

  saveCustomer(): void {
    if (this.currentCustomerId) {
      this.customerService.updateCustomer(this.currentCustomerId, this.newCustomer).subscribe(() => {
        this.loadCustomers();
        this.closeModal();
        this.showAlert('Cliente actualizado con éxito', 'success');
      }, (error: any) => {
        this.showAlert('Error al actualizar el cliente', 'error');
      });
    } else {
      this.customerService.createCustomer(this.newCustomer).subscribe(() => {
        this.loadCustomers();
        this.closeModalCreate();
        this.showAlert('Cliente creado con éxito', 'success');
      }, (error: any) => {
        this.showAlert('Error al crear el cliente', 'error');
      });
    }
  }

  deleteCustomer(id: string): void {
    this.customerService.deleteCustomer(id).subscribe(() => {
      this.loadCustomers();
      this.closeModalDelete();
      this.showAlert('Cliente eliminado con éxito', 'success');
    }, (error: any) => {
      this.showAlert('Error al eliminar el cliente', 'error');
    });
  }

  openModalDelete(customer: Customer, event: Event): void {
    event.stopPropagation();
    this.currentCustomerId = customer.id;
    this.isModalOpenDelete = true;
  }

  closeModalDelete(): void {
    this.isModalOpenDelete = false;
  }

  showAlert(message: string, type: 'error' | 'success' | 'warning' | 'info'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.alertVisible = true;
    setTimeout(() => {
      this.alertVisible = false;
    }, 3000);
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.filteredCustomers.forEach(c => c.selected = checked);
  }
}
