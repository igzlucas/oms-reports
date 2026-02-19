import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Report, ReportDetail, initialReportData } from '../../../core/models/report.model';
import { Customer } from '../../../core/models/customer.model';
import { ReportService } from '../../../core/services/report.service';
import { CustomersService } from '../../../core/services/customers.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  reports: Report[] = [];
  customers: Customer[] = [];
  isModalOpen = false;
  currentReport: Report | Partial<Report> = initialReportData();
  newDetail: ReportDetail = { cantidad: 1, descripcion: '', precioUnitario: 0, total: 0 };
  selectedCustomer: string | null = null;

  constructor(
    private reportService: ReportService,
    private customerService: CustomersService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData() {
    this.customerService.getCustomers().subscribe((customers) => {
      this.customers = customers;
      if (customers.length > 0) {
        // Aseguramos que el id no sea undefined antes de asignarlo
        this.selectedCustomer = customers[0].id ?? null;
      }
    });
    this.reportService.getReportes(null, 1000).subscribe((reports) => {
      this.reports = reports;
    });
  }

  calculateTotal(): void {
    if (this.currentReport.detalles) {
      this.currentReport.montoTotal = this.currentReport.detalles.reduce(
        (acc, detail) => acc + detail.total,
        0
      );
    }
  }

  addDetail(): void {
    if (!this.currentReport.detalles) {
      this.currentReport.detalles = [];
    }
    this.currentReport.detalles.push({ ...this.newDetail, total: this.newDetail.cantidad * this.newDetail.precioUnitario });
    this.newDetail = { cantidad: 1, descripcion: '', precioUnitario: 0, total: 0 }; // Reset
    this.calculateTotal();
  }

  removeDetail(index: number): void {
    if (this.currentReport.detalles) {
        this.currentReport.detalles.splice(index, 1);
        this.calculateTotal();
    }
  }

  openModal(report: Report | Partial<Report>): void {
    this.currentReport = JSON.parse(JSON.stringify(report)); // Deep copy
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  createNewReport(): void {
    const newReport = initialReportData();
    if (this.selectedCustomer) {
        newReport.clienteId = this.selectedCustomer;
    }
    this.openModal(newReport as Report); // Lo tratamos como Report para el modal
  }

  saveReport(): void {
    // Lógica para guardar el reporte, ya sea nuevo o existente
    this.closeModal();
  }

  generatePDF(reportId: string): void {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    const data = document.getElementById(`report-content-${report.id}`);
    if (data) {
      html2canvas(data).then(canvas => {
        const imgWidth = 208;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save(`reporte-${report.clienteId}.pdf`);
      });
    }
  }
}
