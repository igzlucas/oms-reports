import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';
import { Report, initialReportData } from '../../../core/models/report.model';
import { CustomersService } from '../../../core/services/customers.service';
import { Customer } from '../../../core/models/customer.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('reportContent') reportContent!: ElementRef;

  report: Report = initialReportData();
  customers: Customer[] = [];
  reports: Report[] = [];
  selectedCustomer: string | null = null;
  isLoading = false;
  isModalOpen = false;
  isSaving = false;
  currentReport: Report | null = null;

  constructor(
    private reportService: ReportService,
    private customerService: CustomersService,
    private toastr: ToastrService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe(
      (customers) => {
        this.customers = customers;
        if (customers.length > 0) {
          this.selectedCustomer = customers[0].id;
          this.loadReports();
        }
      },
      (error: any) => {
        this.toastr.error('Error al cargar los clientes.');
        console.error(error);
      }
    );
  }

  ngAfterViewInit(): void {
    this.cdRef.detectChanges();
  }

  loadReports(): void {
    this.isLoading = true;
    this.reportService.getReportes(this.selectedCustomer, 0).subscribe(
      (reports) => {
        this.reports = reports;
        this.isLoading = false;
      },
      (error: any) => {
        this.toastr.error('Error al cargar los reportes.');
        console.error(error);
        this.isLoading = false;
      }
    );
  }

  onCustomerChange(event: any): void {
    this.selectedCustomer = event.target.value;
    this.loadReports();
  }

  openModal(report: Report | null): void {
    this.currentReport = report;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentReport = null;
  }

  saveReport(): void {
    this.isSaving = true;
    if (this.currentReport) {
      this.reportService.sendReport(this.currentReport).subscribe(
        () => {
          this.isSaving = false;
          this.closeModal();
          this.loadReports();
          this.toastr.success('Reporte guardado con éxito.');
        },
        (error: any) => {
          this.isSaving = false;
          this.toastr.error('Error al guardar el reporte.');
          console.error(error);
        }
      );
    }
  }

  createReport(): void {
    const newReport = initialReportData();
    newReport.clienteId = this.selectedCustomer!;
    this.openModal(newReport);
  }

  async generatePdf(report: Report): Promise<void> {
    this.currentReport = report;
    this.isModalOpen = true;
    this.cdRef.detectChanges();

    setTimeout(async () => {
      try {
        if (!this.reportContent) {
          console.error('reportContent is not defined');
          return;
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const content = this.reportContent.nativeElement;
        const canvas = await html2canvas(content, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`reporte-${report.cliente}.pdf`);
      } catch (error) {
        this.toastr.error('Error al generar el PDF.');
        console.error('Error generating PDF', error);
      } finally {
        this.closeModal();
      }
    }, 1000);
  }

  ngOnDestroy(): void {}
}
