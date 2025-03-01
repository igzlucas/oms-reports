import { Component, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { CustomersService, Customer , CustomerRequest } from '../../../core/services/customers.service'
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent ],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.css'
})
export default class CustomerComponent implements OnInit {
  customers: Customer[] = [];
  isModalOpen = false;
  isLoading = true;
  isModalOpenCreate = false;
  isModalOpenDelete = false;
  dropdownOpen = false;
  selectAllChecked = false;
  selectedCustomer: any = null;
  currentCustomer: CustomerRequest = {
    empresaId: '',
    nombre: '',
    direccion: ''
  };
  searchText: string = '';


  
errors: any = {};

alertVisible = false;
alertMessage = '';
alertType: 'success' | 'error' | 'warning' | 'info' = 'info';


  constructor(private customersService: CustomersService) {}

  ngOnInit(){
    setTimeout(() => {
      this.getCustomers();
      this.isLoading = false;
    }, 500);
    
  }

  toggleSelectAll() {
    const allSelected = this.customers.every(customer => (customer as any).selected);
    this.customers.forEach(customer => {
      (customer as any).selected = !allSelected;
    });
  }


getCustomers(): void{
  const userId = environment.users.id; 
    this.customersService.getClientes(userId).subscribe({
      next: (data) => {
        return this.customers = (data.resultado as Customer[]).map((cliente: Customer) => ({
          ...cliente,
          selected: false
        }));
      },
      error: (err) => {
        this.showAlert('error', 'Error al cargar los clientes: ' +  err);
      }
    });

}


toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
}
 

// Función para abrir el modal
openModal(customer?: any, event?: Event) {
  event?.preventDefault();  // Evita que se recargue la página
  this.selectedCustomer = customer;
  this.isModalOpen = true;
}



closeModal() {
  this.isModalOpen = false;
}
// Función para guardar los cambios
updateCustomer() {
  this.currentCustomer.empresaId = environment.bussines.id;
  this.currentCustomer.nombre = this.selectedCustomer.clienteNombre;
  this.currentCustomer.direccion = this.selectedCustomer.clienteDireccion;
  if (!this.currentCustomer.nombre) {
    this.showAlert('error', 'El nombre del cliente no puede ser vacío');
    this.closeModal();
    return;
  }
  if (!this.selectedCustomer.clienteId) {  
    this.showAlert('error', 'El identificador del cliente no puede ser vacío');
    this.closeModal();
    return;
  } else {
    // Si el cliente ya tiene un ID, actualizarlo
    this.customersService
      .actualizarCliente(this.selectedCustomer.clienteId, this.currentCustomer)
      .subscribe(response => {
        this.showAlert('success', 'Clientes actualizado exitosamente : ' + response.nombre);       
        this.closeModal();
      }, error => {
        this.showAlert('error', error);
        return
      });
    
   
  }
}

saveCustomer(){
  this.currentCustomer.empresaId = environment.bussines.id;
   // Si no tiene ID, crearlo
   if (!this.currentCustomer.nombre && !this.currentCustomer.direccion ) {
    this.showAlert('error', 'El nombre no deben de estar vacíos');
    this.closeModalCreate();
    return;
  }
   this.customersService
   .crearCliente(this.currentCustomer)
   .subscribe(response => {
    this.showAlert('success', 'Clientes creado exitosamente : ' + response.nombre);   
     this.closeModalCreate();
   }, error => {
    this.showAlert('error', error.error.detalles);
    this.closeModalCreate();
    return;
   });
  
}

get filteredCustomers() {
  return this.customers.filter(customer =>
    customer.clienteNombre.toLowerCase().includes(this.searchText.toLowerCase())
  );
}



// Función para eliminar los cambios
deleteCustomer() {

  if (!this.selectedCustomer?.clienteId) {  
    this.showAlert('error', 'No has seleccionado un cliente válido');
    this.closeModalDelete();
    return;
  }

  this.customersService.eliminarCliente(this.selectedCustomer.clienteId).subscribe({
    next: () => {
      // Filtra la lista para eliminar el cliente eliminado
      this.customers = this.customers.filter(c => c.clienteId !== this.selectedCustomer.clienteId);

      this.showAlert('success', 'Cliente eliminado exitosamente');
      this.closeModalDelete();
    },
    error: (error) => { 
      this.showAlert('error', error.error?.detalles || 'Error al eliminar el cliente');
      this.closeModalDelete();
    }
  });
}

showAlert(type: 'success' | 'error' | 'warning' | 'info', message: string) {
  this.alertType = type;
  this.alertMessage = message;
  this.alertVisible = true;

  // Oculta automáticamente la alerta después de 5 segundos
  setTimeout(() => {
    this.alertVisible = false;
  }, 5000);
}



// Función para abrir el modal
openModalCreate(event?: Event) {
  event?.preventDefault();  // Evita que se recargue la página
  this.currentCustomer.nombre = '',
  this.currentCustomer.direccion = '',
  this.isModalOpenCreate = true;
}

closeModalCreate() {
  this.isModalOpenCreate = false;
}


// Función para abrir el modal
openModalDelete(customer?: any, event?: Event) {
  event?.preventDefault();  // Evita que se recargue la página
  this.selectedCustomer = customer;
  this.isModalOpenDelete = true;
}



closeModalDelete() {
  this.isModalOpenDelete = false;
}


}
