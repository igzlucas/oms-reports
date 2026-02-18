import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';
import { CustomersService } from '../../../core/services/customers.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer, CustomerRequest } from '../../../core/models/customer.model';
import { Report, initialReportData, Detail } from '../../../core/models/report.model';
import { ToastrService } from 'ngx-toastr';
declare var SignaturePad: any;

@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css'],
  providers: [ReportService, CustomersService]
})
export class ReporteComponent implements OnInit, AfterViewInit {
  @ViewChild('signaturePad', { static: false }) signaturePadElement!: ElementRef;
  customers: Customer[] = [];
  reportData: Report = initialReportData();
  
  isModalOpen: boolean = false;
  selectedCustomer: Customer | null = null;
  searchTerm: string = '';
  private signaturePad: any;

  errors: any = {};
  loading: boolean = false;
  alertVisible: boolean = false;
  alertMessage: string = '';
  alertType: string = '';
  isModalOpenCreate: boolean = false;
  currentCustomer: CustomerRequest = { nombre: '', direccion: '', email: '', telefono: '' };

  constructor(
    private reportService: ReportService,
    private customerService: CustomersService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.reportData.fecha = new Date().toISOString().substring(0, 10);
  }

  ngAfterViewInit(): void {
    if (this.signaturePadElement) {
      this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement);
    } else {
      console.error('Signature pad element not found');
    }
  }
  
  loadCustomers(): void {
    this.customerService.getCustomers().subscribe(
      (data) => {
        this.customers = data;
      },
      (error) => {
        console.error('Error loading customers:', error);
      }
    );
  }

  onCustomerChange(customerId: string): void {
    const customer = this.customers.find(c => c.id === customerId);
    if (customer) {
      this.selectedCustomer = customer;
      this.reportData.cliente = customer.nombre;
      this.reportData.clienteId = customer.id;
      this.reportData.clienteDireccion = customer.direccion;
    }
  }

  openCustomerModal(): void {
    this.isModalOpen = true;
  }

  closeCustomerModal(): void {
    this.isModalOpen = false;
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.reportData.cliente = customer.nombre;
    this.reportData.clienteId = customer.id;
    this.reportData.clienteDireccion = customer.direccion;
    this.closeCustomerModal();
  }

  filterCustomers(): Customer[] {
    if (!this.searchTerm) {
      return this.customers;
    }
    return this.customers.filter(customer =>
      customer.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  clearSignature(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  addDetail(): void {
    this.reportData.detalles.push({ cantidad: 1, descripcion: '', valorUnitario: 0, valorTotal: 0 });
  }

  removeDetail(index: number): void {
    this.reportData.detalles.splice(index, 1);
  }

  updateTotal(detail: Detail): void {
    detail.valorTotal = detail.cantidad * detail.valorUnitario;
  }

  calculateSubtotal(): number {
    return this.reportData.detalles.reduce((sum, detail) => sum + detail.valorTotal, 0);
  }

  sendReport(): void {
    this.loading = true;
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      this.reportData.firma = this.signaturePad.toDataURL();
    } else {
      this.toastr.warning('La firma es requerida');
      this.loading = false;
      return;
    }

    this.reportService.createReport(this.reportData).subscribe({
      next: (response) => {
        this.toastr.success('Reporte enviado con éxito');
        this.resetForm();
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Error al enviar el reporte');
        console.error('Error sending report:', error);
        this.loading = false;
      }
    });
  }
  
  resetForm(): void {
    this.reportData = initialReportData();
    this.selectedCustomer = null;
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  openModalCreate(event: Event): void {
    event.stopPropagation();
    this.isModalOpenCreate = true;
  }

  closeModalCreate(): void {
    this.isModalOpenCreate = false;
  }

  saveCustomer(): void {
    this.customerService.createCustomer(this.currentCustomer).subscribe(() => {
      this.loadCustomers();
      this.closeModalCreate();
      this.toastr.success('Cliente creado con éxito');
    }, (error: any) => {
      this.toastr.error('Error al crear el cliente');
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toISOString().substring(0, 10);
  }

  updateFecha(event: any): void {
    this.reportData.fecha = event.target.value;
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  removeSignature(): void {
    this.reportData.firma = '';
  }

  clearCanvas(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  saveSignature(): void {
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      this.reportData.firma = this.signaturePad.toDataURL();
      this.closeModal();
    } else {
      this.toastr.warning('La firma no puede estar vacía');
    }
  }
}
