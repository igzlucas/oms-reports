import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


interface Reporte {
  reporteId: number;
  fecha: string;
  empresa: string;
  cliente: string;
  persona: string;
  equipo: string;
  problema: string;
  trabajo: string;
  monto: number;
  moneda: string;
  observaciones: string;
  [key: string]: any; // Firma de índice
}

interface Detalle {
  cantidad: number;
  descripcion: string;
  precio: number;
  total: number;
}


@Component({
  selector: 'app-reportes-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-table.component.html',
  styleUrl: './reportes-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReportesTableComponent implements OnInit { 

  isLoading = true;
  reportes: Reporte[] = [];
  detalles: Detalle[] = [];
  currentOpenReporteId: any = null;
  pagination = { totalPages: 1, totalRecordsPage: 10, totalRecords: 0, page: 1 };
  searchTerm = '';
  selectedReporte: any = null;


  constructor(private reportService: ReportService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    setTimeout(() => {
      this.fetchReports();
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

  openDetails(reporte?: any){
    if (!reporte) return;

    // Si se hace clic en el reporte que ya está abierto, se cierra
    if (this.currentOpenReporteId === reporte.reporteId) {
      this.currentOpenReporteId = null;
      this.detalles = [];
      return;
    }

    // Se actualiza el reporte abierto
    this.currentOpenReporteId = reporte.reporteId;

    // Se obtienen los detalles del reporte seleccionado
    this.reportService.getDetallesReporte(reporte.reporteId).subscribe({
      next: (response) => {
        this.detalles = response;
        this.cd.detectChanges(); // Fuerza la actualización del DOM
      },
      error: (error) => {
        console.error('Error al obtener los detalles', error);
      }
    });
  }

  get totalCantidad(): number {
    return this.detalles.reduce((sum, detalle) => sum + Number(detalle.cantidad || 0), 0);
  }

  get totalTotal(): number {
    return this.detalles.reduce((sum, detalle) => sum + Number(detalle.total || 0), 0);
  }


}
