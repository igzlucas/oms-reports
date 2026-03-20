
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Customer } from '../../../core/models/customer.model';
import { CustomersService } from '../../../core/services/customers.service';
import { FormsModule } from '@angular/forms';
import { Equipment } from '../../../core/models/equipment.model';
import { NumberOnlyDirective } from '../../../core/directives/number-only.directive';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, NumberOnlyDirective],
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  isModalOpen: boolean = false;
  currentCustomer: Omit<Customer, 'id'> = { nombre: '', direccion: '', email: '', telefono: '', equipos: [] };
  isEditMode: boolean = false;
  currentCustomerId: string = '';
  searchTerm: string = '';
  selectedCustomerIds = new Set<string>();

  // Validation errors
  nombreError: string | null = null;
  direccionError: string | null = null;
  emailError: string | null = null;
  telefonoError: string | null = null;
  equipoErrors: { [index: number]: string | null } = {};
  generalEquipoError: string | null = null;

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
    this.resetErrors(); // Reset errors when opening modal
    if (isEdit && customer) {
      this.currentCustomer = { ...customer, equipos: customer.equipos ? [...customer.equipos] : [] };
      this.currentCustomerId = customer.id ?? '';
    } else {
      this.currentCustomer = { nombre: '', direccion: '', email: '', telefono: '', equipos: [] };
      this.currentCustomerId = '';
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  validateForm(): boolean {
    this.resetErrors();
    let isValid = true;

    if (!this.currentCustomer.nombre) {
      this.nombreError = 'El nombre completo es requerido.';
      isValid = false;
    }

    if (!this.currentCustomer.direccion) {
      this.direccionError = 'La dirección es requerida.';
      isValid = false;
    }

    if (this.currentCustomer.email) {
      const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailPattern.test(this.currentCustomer.email)) {
        this.emailError = 'El formato del correo electrónico no es válido.';
        isValid = false;
      }
    }

    if (this.currentCustomer.telefono && this.currentCustomer.telefono.length > 0 && this.currentCustomer.telefono.length < 10) {
        this.telefonoError = 'El teléfono debe contener 10 dígitos numéricos.';
        isValid = false;
    }

    if (!this.currentCustomer.equipos || this.currentCustomer.equipos.length === 0) {
      this.generalEquipoError = 'Debe registrar al menos un equipo.';
      isValid = false;
    } else {
        this.currentCustomer.equipos.forEach((equipo, index) => {
            if (!equipo.nombre) {
                this.equipoErrors[index] = 'El nombre del equipo es requerido.';
                isValid = false;
            }
        });
    }

    return isValid;
  }

  resetErrors(): void {
    this.nombreError = null;
    this.direccionError = null;
    this.emailError = null;
    this.telefonoError = null;
    this.equipoErrors = {};
    this.generalEquipoError = null;
  }

  saveCustomer(): void {
    if (!this.validateForm()) {
      return; // Stop if form is invalid
    }

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

  filterCustomers(): void {
    this.filteredCustomers = this.customers.filter(
      (c) =>
        c.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  addEquipo(): void {
    if (!this.currentCustomer.equipos) {
      this.currentCustomer.equipos = [];
    }
    this.currentCustomer.equipos.push({ nombre: '', customerId: this.currentCustomerId });
  }

  removeEquipo(index: number): void {
    this.currentCustomer.equipos?.splice(index, 1);
  }

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
