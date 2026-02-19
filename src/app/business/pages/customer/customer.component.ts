import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Customer } from '../../../core/models/customer.model';
import { CustomersService } from '../../../core/services/customers.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  isModalOpen: boolean = false;
  currentCustomer: Omit<Customer, 'id'> = { nombre: '', direccion: '', email: '' };
  isEditMode: boolean = false;
  currentCustomerId: string = '';
  searchTerm: string = '';

  // Propiedades para la selección
  selectedCustomerIds = new Set<string>();

  constructor(private customersService: CustomersService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customersService.getCustomers().subscribe((data) => {
      this.customers = data;
      this.filteredCustomers = data;
    });
  }

  openModal(isEdit: boolean, customer?: Customer): void {
    this.isEditMode = isEdit;
    if (isEdit && customer) {
      this.currentCustomer = { ...customer };
      this.currentCustomerId = customer.id ?? ''; // Aseguramos que no sea undefined
    } else {
      this.currentCustomer = { nombre: '', direccion: '', email: '' };
      this.currentCustomerId = '';
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveCustomer(): void {
    if (this.isEditMode) {
      this.customersService
        .updateCustomer(this.currentCustomerId, this.currentCustomer)
        .subscribe(() => {
          this.loadCustomers();
          this.closeModal();
        });
    } else {
      this.customersService.addCustomer(this.currentCustomer).subscribe(() => {
        this.loadCustomers();
        this.closeModal();
      });
    }
  }

  deleteCustomer(id: string): void {
    this.customersService.deleteCustomer(id).subscribe(() => {
      this.loadCustomers();
    });
  }

  openDeleteConfirmation(customer: Customer): void {
    if (customer.id) {
        this.currentCustomerId = customer.id;
    }
    // Lógica para abrir un modal de confirmación si es necesario
  }

  confirmDeletion(): void {
    this.customersService.deleteCustomer(this.currentCustomerId).subscribe(() => {
      this.loadCustomers();
      // this.isDeleteModalOpen = false;
    });
  }

  filterCustomers(): void {
    this.filteredCustomers = this.customers.filter(
      (c) =>
        c.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // --- Métodos de Selección ---
  isCustomerSelected(customerId: string): boolean {
    return this.selectedCustomerIds.has(customerId);
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.filteredCustomers.forEach(c => this.selectedCustomerIds.add(c.id));
    } else {
      this.selectedCustomerIds.clear();
    }
  }
  
  toggleCustomerSelection(customerId: string, checked: boolean): void {
      if(checked) {
          this.selectedCustomerIds.add(customerId);
      } else {
          this.selectedCustomerIds.delete(customerId);
      }
  }

  deleteSelectedCustomers(): void {
    const deletePromises = Array.from(this.selectedCustomerIds).map(id => 
        this.customersService.deleteCustomer(id).toPromise()
    );
    Promise.all(deletePromises).then(() => {
        this.loadCustomers();
        this.selectedCustomerIds.clear();
    });
  }
}
