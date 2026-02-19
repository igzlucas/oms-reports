import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Asegurando que CommonModule esté aquí
import { Router } from '@angular/router';
import { ReportService } from '../../core/services/report.service';
import { CustomersService } from '../../core/services/customers.service';
import { Report } from '../../core/models/report.model';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface RecentActivity {
  icon: string;
  description: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule // ¡CORREGIDO! CommonModule es necesario para directivas como *ngFor
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  totalReports = 0;
  totalCustomers = 0;
  recentReports: any[] = [];
  recentActivities: RecentActivity[] = [];
  currentYear = new Date().getFullYear();

  constructor(
    private router: Router,
    private reportService: ReportService,
    private customerService: CustomersService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    forkJoin({
      reports: this.reportService.getReportes(null, 5),
      customers: this.customerService.getCustomers()
    }).pipe(
      map(({ reports, customers }) => {
        return {
          reports: reports.map(report => {
            const customer = customers.find(c => c.id === report.clienteId);
            return {
              ...report,
              customerName: customer ? customer.nombre : 'Cliente Desconocido'
            };
          }),
          customers
        };
      })
    ).subscribe(({ reports, customers }) => {
      this.totalReports = reports.length;
      this.totalCustomers = customers.length;
      this.recentReports = reports;

      if (reports.length > 0) {
        this.recentActivities.push({
          icon: 'fas fa-file-alt',
          description: `Nuevo reporte para ${reports[0].customerName}`,
          time: 'Hace 5 minutos'
        });
      }
      if (customers.length > 0 && customers.length > this.totalCustomers) {
         this.recentActivities.push({
          icon: 'fas fa-user-plus',
          description: `Nuevo cliente: ${customers[customers.length - 1].nombre}`,
          time: 'Hace 1 hora'
        });
      }
    });
  }

  goToNewReport(): void {
    this.router.navigate(['/new-report']);
  }
}
