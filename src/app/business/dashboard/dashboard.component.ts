import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../core/services/report.service';
import { CustomersService } from '../../core/services/customers.service';
import { CommonModule } from '@angular/common';
import { Report } from '../../core/models/report.model';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  numeroReportes: number = 0;
  numeroClientes: number = 0;
  montoTotal: number = 0;
  ultimosReportes: Report[] = [];
  ultimosClientes: Customer[] = [];
  isLoading: boolean = true;
  totalReportes: number = 0;
  totalClientes: number = 0;
  showDropdown: boolean = false;
  columnas: any[] = [];
  pagination: any = { page: 1, totalPages: 1 };
  reportes: any[] = [];

  constructor(
    private reportService: ReportService,
    private customerService: CustomersService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.reportService.getReportes(null, 5).subscribe(
      (data) => {
        this.ultimosReportes = data;
        this.montoTotal = data.reduce((acc, report) => acc + Number(report.monto), 0);
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching reports:', error);
        this.isLoading = false;
      }
    );

    this.customerService.getCustomers().subscribe(
      (data) => {
        this.ultimosClientes = data.slice(0, 5);
      },
      (error) => {
        console.error('Error fetching customers:', error);
      }
    );

    this.getNumeroReportes();
    this.getNumeroClientes();
  }

  getNumeroReportes() {
    this.reportService.getNumeroReportes().then(response => {
      this.numeroReportes = response;
      this.totalReportes = response;
    }).catch(error => {
      console.error('Error fetching number of reports:', error);
    });
  }

  getNumeroClientes() {
    this.customerService.getNumeroClientes().then(response => {
      this.numeroClientes = response;
      this.totalClientes = response;
    }).catch(error => {
      console.error('Error fetching number of customers:', error);
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  toggleColumn(index: number) {
    this.columnas[index].visible = !this.columnas[index].visible;
  }

  changePage(page: number) {
    this.pagination.page = page;
  }
}
