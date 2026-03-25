import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';

import { Customer } from '../../../core/models/customer.model';
import { CustomersService } from '../../../core/services/customers.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ToastService } from '../../../core/services/toast.service';
import { NumberOnlyDirective } from '../../../core/directives/number-only.directive';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, NumberOnlyDirective],
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  private customersService = inject(CustomersService);
  private empresaService = inject(EmpresaService);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);

  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  isModalOpen: boolean = false;
  
  currentCustomer: any = { nombre: '', direccion: '', email: '', telefono: '', equipos: [] };
  
  isEditMode: boolean = false;
  currentCustomerId: string = '';
  searchTerm: string = '';
  selectedCustomerIds = new Set<string>();

  nombreError: string | null = null;
  direccionError: string | null = null;
  emailError: string | null = null;
  telefonoError: string | null = null;
  equipoErrors: { [index: number]: string | null } = {};
  generalEquipoError: string | null = null;

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
    this.resetErrors();
    if (isEdit && customer) {
      this.currentCustomer = {
        nombre: customer.nombre,
        direccion: customer.address, 
        email: customer.email,
        telefono: customer.phone, 
        equipos: customer.equipos ? [...customer.equipos] : []
      };
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
        this.currentCustomer.equipos.forEach((equipo: any, index: number) => {
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
      return;
    }

    this.empresaService.getEmpresa().pipe(take(1)).subscribe(empresa => {
      if (!empresa || !empresa.id) {
        console.error("Error Crítico: No se pudo obtener la empresa.");
        return;
      }

      const customerData: Omit<Customer, 'id'> = {
        empresaId: empresa.id,
        nombre: this.currentCustomer.nombre,
        address: this.currentCustomer.direccion, 
        email: this.currentCustomer.email,
        phone: this.currentCustomer.telefono,   
        equipos: this.currentCustomer.equipos.map((e: any) => ({ nombre: e.nombre })) 
      };

      if (this.isEditMode) {
        this.customersService.updateCustomer(this.currentCustomerId, customerData).subscribe(() => {
          this.toastService.show('Cliente actualizado con éxito', 'success');
          this.loadCustomers();
          this.closeModal();
        });
      } else {
        this.customersService.addCustomer(customerData).subscribe(() => {
          this.toastService.show('Cliente creado con éxito', 'success');
          this.loadCustomers();
          this.closeModal();
        });
      }
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    const confirmed = await this.confirmationService.confirm(
      '¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.'
    );
    if (confirmed) {
      this.customersService.deleteCustomer(id).subscribe(() => {
        this.toastService.show('Cliente eliminado con éxito', 'success');
        this.loadCustomers();
      });
    }
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
    this.currentCustomer.equipos.push({ nombre: '' });
  }

  removeEquipo(index: number): void {
    this.currentCustomer.equipos?.splice(index, 1);
  }
  
  isCustomerSelected(customerId: string): boolean {
    return this.selectedCustomerIds.has(customerId);
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.filteredCustomers.forEach(c => {
        if (c.id) {
          this.selectedCustomerIds.add(c.id);
        }
      });
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

  async deleteSelectedCustomers(): Promise<void> {
    const confirmed = await this.confirmationService.confirm(
      `¿Estás seguro de que quieres eliminar los ${this.selectedCustomerIds.size} clientes seleccionados? Esta acción no se puede deshacer.`
    );
    if (confirmed) {
      const deletePromises = Array.from(this.selectedCustomerIds).map(id => 
          this.customersService.deleteCustomer(id).toPromise()
      );
      Promise.all(deletePromises).then(() => {
          this.toastService.show('Clientes eliminados con éxito', 'success');
          this.loadCustomers();
          this.selectedCustomerIds.clear();
      });
    }
  }
}
