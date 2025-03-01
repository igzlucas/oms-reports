import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { CustomersService } from '../../core/services/customers.service';

export interface Reporte {
  reporteId: number;
  fecha: string;
  empresa: string;
  cliente: string;
  equipo: string;
  problema: string;
  trabajo: string;
  monto: number;
  moneda: string;
  observaciones: string;
  [key: string]: any; // Firma de índice
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export default class DashboardComponent implements OnInit {
  reportes: Reporte[] = [];
  isLoading = true;
  showDropdown: boolean = false;
  totalReportes: number = 0;
  totalClientes: number = 0;
  open = false;
  pagination = { totalPages: 1, totalRecordsPage: 10, totalRecords: 0, page: 1 };
  searchTerm = '';


   constructor(private reportService: ReportService,private customerService: CustomersService, private cd: ChangeDetectorRef) {}
  
    ngOnInit() {
      setTimeout(() => {      
          this.fetchReports()
          this.numeroReportes();
          this.numeroClientes();
          this.isLoading = false;                 
      }, 500);
    }


    fetchReports(page: number = 1) {
      this.reportService.getReportes(page, this.pagination.totalRecordsPage).subscribe(response => {
        if (response && response.reportes) {
          this.reportes = response.reportes;
          this.pagination = response.pagination;
          this.pagination.page = page;
        } else {
          this.reportes = [];
        }
        this.cd.detectChanges();
      }, error => {
        console.error('Error al obtener reportes', error);
      });
    }
    
    filterReports() {
      this.fetchReports();
    }
  
    changePage(page: number) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.pagination.page = page; 
        this.fetchReports(page);
      }
    }


    columnas = [
      { key: 'reporteId', label: 'N° Reporte', visible: true },
      { key: 'fecha', label: 'Fecha', visible: true },
      { key: 'empresa', label: 'Empresa', visible: false },
      { key: 'cliente', label: 'Cliente', visible: true },
      { key: 'equipo', label: 'Equipo', visible: true },
      { key: 'problema', label: 'Problema', visible: true },
      { key: 'trabajo', label: 'Trabajo', visible: false },
      { key: 'monto', label: 'Monto', visible: true },
      { key: 'moneda', label: 'Moneda', visible: true },
      { key: 'observaciones', label: 'Observaciones', visible: false }
    ];


    toggleColumn(index: number) {
      this.columnas[index].visible = !this.columnas[index].visible;
    }
  
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    }

    numeroReportes(){
      this.reportService.getNumeroReportes().subscribe(response => {
          this.totalReportes = parseInt(response.toString());
      }, error => {
        console.error('Error al obtener total de reportes', error);
      });
    }


    numeroClientes(){
      this.customerService.getNumeroClientes().subscribe(response => {
          this.totalClientes = parseInt(response.toString());
      }, error => {
        console.error('Error al obtener total de clientes', error);
      });
    }

}
