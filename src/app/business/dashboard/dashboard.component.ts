import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Report } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { ClientService } from '../../core/services/client.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Timestamp } from 'firebase/firestore';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, take, switchMap } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);


interface ReportWithClientName extends Report {
  clientName: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [DatePipe],
})
export class DashboardComponent implements OnInit {
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);
  private empresaService = inject(EmpresaService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  dashboardStats$!: Observable<{ 
    totalReports: number; 
    totalClients: number; 
    completedUsd: number; 
    completedMxn: number; 
  }>;
  recentReports$!: Observable<ReportWithClientName[]>;
  chart: any;

  currentYear: number = new Date().getFullYear();

  ngOnInit(): void {
    this.empresaService.getEmpresa().pipe(
      switchMap(empresa => {
        if (empresa && empresa.id) {
          const empresaId = empresa.id;
          this.loadDashboardStats(empresaId);
          this.loadRecentReports(empresaId);
          this.loadReportStatusChart(empresaId);
        }
        return of(null); 
      }),
      catchError(err => {
        console.error('Error al obtener la empresa en el Dashboard:', err);
        return of(null);
      })
    ).subscribe();
  }

  private getJsDate(date: Date | Timestamp): Date {
    return date instanceof Timestamp ? date.toDate() : date;
  }

  loadDashboardStats(empresaId: string): void {
    this.dashboardStats$ = forkJoin({
      totalReports: this.reportService.getReportsCountByEmpresa(empresaId).pipe(catchError(() => of(0))),
      totalClients: this.clientService.getClientsCountByEmpresa(empresaId).pipe(catchError(() => of(0))),
      completedTotals: this.reportService.getReportsByEmpresa(empresaId).pipe(
        map(reports => reports.reduce((acc, report) => {
          if (report.status === 'completado') {
            if (report.moneda === 'USD') acc.usd += report.montoTotal;
            else if (report.moneda === 'MXN') acc.mxn += report.montoTotal;
          }
          return acc;
        }, { usd: 0, mxn: 0 })),
        catchError(() => of({ usd: 0, mxn: 0 }))
      )
    }).pipe(
      map(({ totalReports, totalClients, completedTotals }) => ({
        totalReports,
        totalClients,
        completedUsd: completedTotals.usd,
        completedMxn: completedTotals.mxn,
      }))
    );
  }

  loadRecentReports(empresaId: string): void {
    this.recentReports$ = forkJoin({
        reports: this.reportService.getReportsByEmpresa(empresaId, 5).pipe(take(1)),
        clients: this.clientService.getClientsByEmpresa(empresaId).pipe(take(1))
      }).pipe(
        map(({ reports, clients }) => {
          const clientMap = new Map(clients.map(c => [c.id, c.nombre]));
          return reports.map(report => ({
            ...report,
            clientName: clientMap.get(report.clientId) || 'Cliente Desconocido'
          }));
        }),
        catchError(() => of([])) 
      );
  }

  loadReportStatusChart(empresaId: string): void {
    this.reportService.getReportsByEmpresa(empresaId).pipe(
      map(reports => {
        let completadoCount = 0;
        let pendienteCount = 0;

        reports.forEach(report => {
          if (report.status === 'completado') {
            completadoCount++;
          } else {
            pendienteCount++;
          }
        });

        const chartData = {
          labels: ['Completado', 'Pendiente'],
          datasets: [{
            label: 'Número de Reportes',
            data: [completadoCount, pendienteCount],
            backgroundColor: [
              'rgba(75, 192, 192, 0.2)', // green
              'rgba(255, 206, 86, 0.2)', // yellow
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1
          }]
        };

        this.createChart(chartData);
      }),
      catchError((err) => {
        console.error('Error loading report status chart:', err);
        this.createChart(null);
        return of(null);
      })
    ).subscribe();
  }

  createChart(data: any): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const canvas = document.getElementById('reportStatusChart') as HTMLCanvasElement;
    if (!canvas) {
      return;
    }

    if (data && data.labels && data.labels.length > 0) {
      this.chart = new Chart(canvas, {
        type: 'bar', // Changed to bar chart
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1 // Ensure y-axis has integer steps
              }
            }
          }
        },
      });
    } else {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data available for chart', canvas.width / 2, canvas.height / 2);
        }
    }
  }

  getFormattedDate(date: any): string | null {
    if (!date) return null;
    const jsDate = this.getJsDate(date);
    return this.datePipe.transform(jsDate, 'dd/MM/yyyy');
  }

  goToReportDetail(reportId: string): void {
    if (reportId) {
      this.router.navigate(['/reports', reportId]);
    }
  }

  goToNewReport(): void {
    this.router.navigate(['/new-report']);
  }
}
