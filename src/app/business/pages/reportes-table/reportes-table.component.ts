import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';
import { Clipboard } from '@angular/cdk/clipboard';
import { FormsModule } from '@angular/forms';

// Modelos y Servicios
import { Report } from '../../../core/models/report.model';
import { Customer } from '../../../core/models/customer.model';
import { Empresa } from '../../../core/models/empresa.model';
import { ReportService } from '../../../core/services/report.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { CustomersService } from '../../../core/services/customers.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reportes-table',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reportes-table.component.html',
  styleUrls: ['./reportes-table.component.css'],
  providers: [DatePipe]
})
export class ReportesTableComponent implements OnInit {
  // Servicios
  private reportService = inject(ReportService);
  private empresaService = inject(EmpresaService);
  private customersService = inject(CustomersService);
  private datePipe = inject(DatePipe);
  private clipboard = inject(Clipboard);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);

  // Estado de los Datos
  private allReports: Report[] = [];
  filteredReports: Report[] = [];
  paginatedReports: Report[] = [];
  private customerNames = new Map<string, string>();
  
  // Estado del Ordenamiento
  sortColumn: keyof Report | 'cliente' = 'reporteId';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Paginación
  currentPage = 1;
  itemsPerPage = 8;
  totalPages = 0;

  // UI
  copiedState: { type: 'pin' | 'link'; id: string } | null = null;
  searchTerm: string = '';
  openDropdownId: string | null = null;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-toggle')) {
      this.openDropdownId = null;
    }
  }

  ngOnInit(): void {
    this.empresaService.getEmpresa().pipe(
      switchMap((empresa: Empresa | null) => {
        if (empresa && empresa.id) {
          return forkJoin({
            reports: this.reportService.getReportsByEmpresa(empresa.id),
            customers: this.customersService.getCustomers()
          });
        }
        return forkJoin({ reports: [], customers: [] });
      })
    ).subscribe(({ reports, customers }) => {
      customers.forEach((customer: Customer) => {
        if (customer.id && customer.nombre) {
          this.customerNames.set(customer.id, customer.nombre);
        }
      });
      
      this.allReports = reports;
      this.filterAndSort();
    });
  }

  filterAndSort(): void {
    this.filteredReports = this.allReports.filter(report => 
      this.getClientName(report.clientId).toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.sortData(this.sortColumn, false);
  }

  updatePaginatedReports(): void {
    this.totalPages = Math.ceil(this.filteredReports.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedReports = this.filteredReports.slice(startIndex, endIndex);
    
    if (this.paginatedReports.length === 0 && this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  sortData(column: keyof Report | 'cliente', toggleDirection: boolean = true): void {
    if (toggleDirection && this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      if (toggleDirection) {
        this.sortDirection = 'asc';
      }
    }

    this.filteredReports.sort((a, b) => {
      let valA: any, valB: any;
      switch (column) {
        case 'cliente':
          valA = this.getClientName(a.clientId).toLowerCase();
          valB = this.getClientName(b.clientId).toLowerCase();
          break;
        case 'fecha':
          valA = a.fecha instanceof Timestamp ? a.fecha.toMillis() : new Date(a.fecha).getTime();
          valB = b.fecha instanceof Timestamp ? b.fecha.toMillis() : new Date(b.fecha).getTime();
          break;
        case 'montoTotal':
          valA = a.montoTotal || 0;
          valB = b.montoTotal || 0;
          break;
        default:
          valA = a[column as keyof Report] || '';
          valB = b[column as keyof Report] || '';
          break;
      }
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.currentPage = 1;
    this.updatePaginatedReports();
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedReports();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  toggleDropdown(reportId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === reportId ? null : reportId;
  }

  getClientName(clientId: string): string {
    return this.customerNames.get(clientId) || 'Cliente Desconocido';
  }

  async deleteReport(reportId: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    this.openDropdownId = null;
    const confirmed = await this.confirmationService.confirm(
      '¿Estás seguro de que quieres eliminar este reporte? Esta acción no se puede deshacer.'
    );

    if (confirmed) {
      try {
        await this.reportService.deleteReport(reportId);
        this.allReports = this.allReports.filter(report => report.id !== reportId);
        this.filterAndSort();
        this.toastService.show('Reporte eliminado con éxito', 'success');
      } catch (error) {
        console.error('Error al eliminar el reporte:', error);
        this.toastService.show('Error al eliminar el reporte. Por favor, intenta de nuevo.', 'error');
      }
    }
  }

  getFormattedDate(date: any): string | null {
    if (!date) return null;
    const jsDate = date instanceof Timestamp ? date.toDate() : date;
    return this.datePipe.transform(jsDate, 'dd/MM/yyyy');
  }

  copyPin(pin: string, reportId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.clipboard.copy(pin);
    this.setCopiedState('pin', reportId);
  }

  copyShareLink(report: Report, event: MouseEvent): void {
    event.stopPropagation();
    const link = this.getShareableLink(report);
    if (link && report.pin) {

      const message = `Estimado ${report.personaQuienReporta} ,\n\nLe compartimos la información para que pueda acceder a su reporte de servicio:\n\nEnlace: ${link}\nPIN de acceso: ${report.pin}\n\nDesde este enlace, podrá revisar el detalle del reporte y firmarlo digitalmente para confirmar su conformidad.\n\nGracias por su confianza.`;
      this.clipboard.copy(message);

      this.setCopiedState('link', report.id);
      
      this.toastService.show('Mensaje para compartir copiado al portapapeles', 'success');
    }
    setTimeout(() => this.openDropdownId = null, 300);
  }

  getShareableLink(report: Report): string | null {
    if (!report.publicLinkToken) return null;
    return `${window.location.origin}/report-viewer/${report.publicLinkToken}/auth`;
  }

  getReportViewUrl(report: Report, download: boolean = false): string {
    if (!report.publicLinkToken || !report.pin) {
      return `javascript:alert('Falta información (token o pin) para generar el enlace de este reporte.');`;
    }
    const baseUrl = `${window.location.origin}/report-viewer/${report.publicLinkToken}/view?pin=${report.pin}`;
    return download ? `${baseUrl}&download=true` : baseUrl;
  }

  private setCopiedState(type: 'pin' | 'link', id: string): void {
    this.copiedState = { type, id };
    setTimeout(() => {
      if (this.copiedState && this.copiedState.id === id) {
        this.copiedState = null;
      }
    }, 2000);
  }
}
