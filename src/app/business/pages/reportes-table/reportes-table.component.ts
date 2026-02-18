import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';
import { CommonModule } from '@angular/common';
import { Report } from '../../../core/models/report.model';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reportes-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-table.component.html',
  styleUrls: ['./reportes-table.component.css'],
  providers: [ReportService]
})
export class ReportesTableComponent implements OnInit {
  reportes: Report[] = [];
  visibleReportes: Report[] = [];
  filteredReportes: Report[] = [];
  searchTerm: string = '';

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  isModalOpen = false;
  selectedReport: Report | null = null;
  isLoading = true;

  pagination = {
    page: 1,
    totalPages: 0,
    totalRecordsPage: 10,
  };

  currentOpenReporteId: string | null = null;
  detalles: any[] = [];
  totalCantidad = 0;
  totalTotal = 0;

  constructor(
    private reportService: ReportService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.getReportes();
  }

  getReportes(): void {
    this.isLoading = true;
    this.reportService.getReportes(null, 1000).subscribe(
      (response: Report[]) => {
        this.reportes = response;
        this.filteredReportes = response;
        this.totalPages = Math.ceil(this.filteredReportes.length / this.itemsPerPage);
        this.pagination.totalPages = this.totalPages;
        this.updateVisibleReportes();
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Error fetching reports:', error);
        this.toastr.error('Error al cargar los reportes.');
        this.isLoading = false;
      }
    );
  }

  filterReportes(): void {
    this.filteredReportes = this.reportes.filter(reporte =>
      reporte.cliente.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (reporte.id && reporte.id.toString().includes(this.searchTerm.toLowerCase()))
    );
    this.totalPages = Math.ceil(this.filteredReportes.length / this.itemsPerPage);
    this.pagination.totalPages = this.totalPages;
    this.currentPage = 1;
    this.pagination.page = 1;
    this.updateVisibleReportes();
  }

  updateVisibleReportes(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.visibleReportes = this.filteredReportes.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pagination.page = page;
      this.updateVisibleReportes();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pagination.page++;
      this.updateVisibleReportes();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pagination.page--;
      this.updateVisibleReportes();
    }
  }

  async openModal(reporte: Report): Promise<void> {
    try {
      this.isLoading = true;
      const reportDetails = await this.reportService.getDetallesReporte(reporte.id!);
      this.selectedReport = reportDetails;
      this.isModalOpen = true;
      this.isLoading = false;
    } catch (error) {
      console.error('Error fetching report details:', error);
      this.toastr.error('Error al cargar los detalles del reporte.');
      this.isLoading = false;
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedReport = null;
  }

  deleteReport(reporteId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      this.reportService.deleteReport(reporteId).subscribe(
        () => {
          this.toastr.success('Reporte eliminado exitosamente');
          this.getReportes();
        },
        (error) => {
          this.toastr.error('Error al eliminar el reporte');
          console.error('Error deleting report:', error);
        }
      );
    }
  }

  printReport() {
    window.print();
  }

  get totalPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  changePage(page: number): void {
    this.goToPage(page);
  }

  openDetails(reporte: Report): void {
    if (this.currentOpenReporteId === reporte.id) {
      this.currentOpenReporteId = null;
    } else {
      this.currentOpenReporteId = reporte.id!;
    }
  }

  filterReports(): void {
    this.filterReportes();
  }
}
